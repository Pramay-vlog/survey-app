const jwt = require("jsonwebtoken");
const messages = require("../../json/message.json");
const { ROOM_TYPE: { SINGLE } } = require("../../json/enums.json");
const DB = require("../../models");


module.exports = async (io) => {

    io.use(async (socket, next) => {

        const token = socket.handshake.headers["x-auth-token"];
        if (!token) return next(new Error(messages.TOKEN_REQUIRED));

        let user;
        try {

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            user = await DB.USER.findByIdAndUpdate(decoded._id, { socketId: socket.id }, { new: true })

        } catch (error) {

            console.log(error);
            return next(new Error(messages.INVALID_TOKEN));

        }

        socket.user = user;
        next()

    });

    io.on("connection", (socket) => {

        console.log("🎯 user connected to socket");

        let joined_users;

        socket.on("self-join", async () => {

            socket.join(socket.user._id);
            socket.emit("self-join", { success: true });

        });


        socket.on("chat-history", async ({ user_id, page, limit }) => {

            try {

                page = +page || 1;
                limit = +limit || 50;
                skip = (page - 1) * limit;

                if (socket.user._id.toString() === user_id) return socket.emit("error", messages.INVALID_REQUEST);

                const recieverUser = await DB.USER.findOne({ _id: user_id, isActive: true }).lean();
                if (!recieverUser) return socket.emit("error", messages.REQUIRED_FIELDS);

                let roomExists = await DB.CHATROOM.findOne({
                    $or: [
                        { sender_id: socket.user._id, receiver_id: user_id, isActive: true },
                        { sender_id: user_id, receiver_id: socket.user._id, isActive: true }
                    ]
                }).lean();

                if (!roomExists) {

                    const response = {
                        success: true,
                        message: messages.SUCCESS,
                        data: []
                    }

                    socket.emit("chat-history", response);

                } else {

                    socket.join(roomExists._id.toString());
                    const rooms = io.sockets.adapter.rooms.get(roomExists._id.toString())
                    joined_users = rooms.size;

                    console.log("joined_users join-room", joined_users)

                    // get chat list
                    let chatList = await DB.CHAT
                        .find({ room_id: roomExists?._id, isActive: true })
                        .skip(skip)
                        .limit(limit)
                        .sort({ createdAt: -1 })
                        .lean();

                    await DB.CHAT.updateMany(
                        { receiver_id: socket.user._id, room_id: roomExists._id, isRead: false },
                        { isRead: true },
                        { new: true }
                    );

                    const response = {
                        success: true,
                        message: messages.SUCCESS,
                        data: chatList
                    }

                    socket.emit("chat-history", response);

                }

            } catch (error) {

                console.log(`join-room error: ${error}`);
                socket.emit("error", messages.FAILED);

            }

        });


        socket.on("rooms-list", async (body) => {

            try {

                body.page = +body.page || 1;
                body.limit = +body.limit || 50;
                let skip = (body.page - 1) * body.limit;

                let data = [
                    { $match: { $or: [{ sender_id: socket.user._id, }, { receiver_id: socket.user._id, },], }, },
                    {
                        $lookup: {
                            from: "user", localField: "sender_id", foreignField: "_id", as: "sender_id",
                            pipeline: [{ $project: { _id: 1, name: 1, image: 1, }, },],
                        },
                    },
                    {
                        $lookup: {
                            from: "user", localField: "receiver_id", foreignField: "_id", as: "receiver_id",
                            pipeline: [{ $project: { _id: 1, name: 1, image: 1, }, },],
                        },
                    },
                    { $unwind: { path: "$sender_id", preserveNullAndEmptyArrays: true, }, },
                    { $unwind: { path: "$receiver_id", preserveNullAndEmptyArrays: true, }, },
                    {
                        $lookup: {
                            from: "chat", localField: "_id", foreignField: "room_id", as: "chat",
                            pipeline: [
                                { $match: { isActive: true } },
                                { $group: { _id: null, data: { $push: "$$ROOT", }, }, },
                                {
                                    $addFields: {
                                        unread_count: {
                                            $size: {
                                                $filter: {
                                                    input: "$data",
                                                    as: "item",
                                                    cond: { $and: [{ $eq: ["$$item.isRead", false], }, { $ne: ["$$item.sender_id", socket.user._id,], },], },
                                                },
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                    },
                    { $unwind: { path: "$chat", preserveNullAndEmptyArrays: true, }, },
                    { $addFields: { last_message: { $last: "$chat.data", }, }, },
                    {
                        $group: {
                            _id: "$_id",
                            sender_id: { $first: "$sender_id", },
                            receiver_id: { $first: "$receiver_id", },
                            room_type: { $first: "$room_type", },
                            last_message: { $first: "$last_message", },
                            unread_count: { $first: "$chat.unread_count", },
                            isActive: { $first: "$isActive", },
                            createdAt: { $first: "$createdAt", },
                            updatedAt: { $first: "$updatedAt", },
                        },
                    },
                    {
                        $facet: {
                            count: [{ $group: { _id: null, count: { $count: {}, }, }, },],
                            data: [{ $sort: { "last_message.createdAt": -1 } }, { $skip: skip }, { $limit: body.limit },],
                        },
                    },
                    { $unwind: { path: "$count", preserveNullAndEmptyArrays: true, }, },
                    { $addFields: { count: "$count.count", }, },
                ]

                const rooms = await DB.CHATROOM.aggregate(data);

                const response = {
                    success: true,
                    message: messages.SUCCESS,
                    data: rooms[0]
                };

                io.to(socket.id).emit("rooms-list", response);

            } catch (error) {

                console.log(`find-rooms error: ${error}`);
                socket.emit("error", messages.FAILED);

            }

        });


        socket.on("send-message", async ({ receiver_id, ...rest }) => {

            try {

                if (socket.user._id.toString() === receiver_id) return socket.emit("error", messages.INVALID_REQUEST);

                const recieverUser = await DB.USER.findOne({ _id: receiver_id, isActive: true }).lean();
                if (!recieverUser) return socket.emit("error", messages.REQUIRED_FIELDS);

                let roomExists = await DB.CHATROOM.findOne({
                    $or: [
                        { sender_id: socket.user._id, receiver_id, isActive: true },
                        { sender_id: receiver_id, receiver_id: socket.user._id, isActive: true }
                    ]
                }).lean();

                if (!roomExists) {
                    roomExists = await DB.CHATROOM.create({ sender_id: socket.user._id, receiver_id, room_type: SINGLE });
                }

                socket.join(roomExists._id.toString());
                const rooms = io.sockets.adapter.rooms.get(roomExists._id.toString())
                joined_users = rooms.size;

                console.log("send message room", joined_users)

                let chat;
                if (joined_users > 1) {
                    console.log("lonely", 123)
                    chat = await DB.CHAT.create({ sender_id: socket.user._id, room_id: roomExists._id, receiver_id, isRead: true, ...rest });

                } else {
                    console.log("commited", 456)
                    io.to(recieverUser.socketId).emit("check-room-list", { success: true });
                    chat = await DB.CHAT.create({ sender_id: socket.user._id, room_id: roomExists._id, receiver_id, isRead: false, ...rest });

                }

                const response = {
                    success: true,
                    message: messages.SUCCESS,
                    data: chat
                };
                console.log("chat", chat)
                io.to(socket.id).emit("send-message", response);
                io.to(recieverUser.socketId).emit("send-message", response);

            } catch (error) {

                console.log(`send-message error: ${error}`);
                socket.emit("error", messages.FAILED);

            }

        });


        socket.on("delete-message", async ({ chat_id, page, limit }) => {

            page = +page || 1;
            limit = +limit || 50;
            skip = (page - 1) * limit;

            const chatExists = await DB.CHAT.findById(chat_id).lean()
            if (!chatExists) return socket.emit("error", messages.REQUIRED_FIELDS);

            if (
                chatExists.sender_id.toString() !== socket.user._id.toString() &&
                chatExists.receiver_id.toString() !== socket.user._id.toString()
            ) socket.emit("error", messages.CHAT_NOT_FOUND);

            await DB.CHAT.findByIdAndUpdate({ _id: chatExists._id }, { isActive: false }, { new: true });

            await DB.CHAT.updateMany(
                {
                    $or: [
                        { receiver_id: socket.user._id, room_id: chatExists.room_id, isRead: false },
                        { sender_id: socket.user._id, room_id: chatExists.room_id, isRead: false },
                    ]
                },
                { isRead: true },
                { new: true }
            );

            socket.emit("delete-message", { success: true, message: messages.SUCCESS });

        });


        socket.on("leave-room", async ({ room_id, page, limit }) => {

            try {

                const roomExists = await DB.CHATROOM.findOne({ _id: room_id, isActive: true }).lean();
                if (!roomExists) return socket.emit("error", messages.REQUIRED_FIELDS);

                socket.leave(room_id);
                const rooms = io.sockets.adapter.rooms.get(room_id.toString())
                joined_users = rooms ? rooms.size : 0;
                console.log("joined_users leave-room", joined_users);

                io.to(socket.id).emit("leave-room", { success: true, messages: messages.SUCCESS });

                page = +page || 1;
                limit = +limit || 50;
                let skip = (page - 1) * limit;

                let data = [
                    { $match: { $or: [{ sender_id: socket.user._id, }, { receiver_id: socket.user._id, },], }, },
                    {
                        $lookup: {
                            from: "user", localField: "sender_id", foreignField: "_id", as: "sender_id",
                            pipeline: [{ $project: { _id: 1, name: 1, image: 1, }, },],
                        },
                    },
                    {
                        $lookup: {
                            from: "user", localField: "receiver_id", foreignField: "_id", as: "receiver_id",
                            pipeline: [{ $project: { _id: 1, name: 1, image: 1, }, },],
                        },
                    },
                    { $unwind: { path: "$sender_id", preserveNullAndEmptyArrays: true, }, },
                    { $unwind: { path: "$receiver_id", preserveNullAndEmptyArrays: true, }, },
                    {
                        $lookup: {
                            from: "chat", localField: "_id", foreignField: "room_id", as: "chat",
                            pipeline: [
                                { $group: { _id: null, data: { $push: "$$ROOT", }, }, },
                                {
                                    $addFields: {
                                        unread_count: {
                                            $size: {
                                                $filter: {
                                                    input: "$data",
                                                    as: "item",
                                                    cond: { $and: [{ $eq: ["$$item.isRead", false], }, { $ne: ["$$item.sender_id", socket.user._id,], },], },
                                                },
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                    },
                    { $unwind: { path: "$chat", preserveNullAndEmptyArrays: true, }, },
                    { $addFields: { last_message: { $last: "$chat.data", }, }, },
                    {
                        $group: {
                            _id: "$_id",
                            sender_id: { $first: "$sender_id", },
                            receiver_id: { $first: "$receiver_id", },
                            room_type: { $first: "$room_type", },
                            last_message: { $first: "$last_message", },
                            unread_count: { $first: "$chat.unread_count", },
                            isActive: { $first: "$isActive", },
                            createdAt: { $first: "$createdAt", },
                            updatedAt: { $first: "$updatedAt", },
                        },
                    },
                    {
                        $facet: {
                            count: [{ $group: { _id: null, count: { $count: {}, }, }, },],
                            data: [{ $sort: { "last_message.createdAt": -1 } }, { $skip: skip }, { $limit: limit },],
                        },
                    },
                    { $unwind: { path: "$count", preserveNullAndEmptyArrays: true, }, },
                    { $addFields: { count: "$count.count", }, },
                ]

                const room = await DB.CHATROOM.aggregate(data);

                const response = {
                    success: true,
                    message: messages.SUCCESS,
                    data: room[0]
                };

                io.to(socket.id).emit("rooms-list", response);

            } catch (error) {

                console.log(`leave-room error: ${error}`);
                socket.emit("error", messages.FAILED);

            }

        });


        socket.on("disconnect-user", async () => {

            try {

                const chatRooms = await DB.CHATROOM.find({
                    $or: [
                        { sender_id: socket.user._id, isActive: true },
                        { receiver_id: socket.user._id, isActive: true }
                    ]
                }).lean();

                chatRooms.forEach(room => {
                    socket.leave(room._id.toString());
                    const rooms = io.sockets.adapter.rooms.get(room._id.toString())
                    joined_users = rooms ? rooms.size : 0;
                });
                console.log("joined_users", joined_users);

                await DB.USER.findByIdAndUpdate(socket.user._id, { socketId: null }, { new: true });

                socket.emit("disconnect-user", { success: true, messages: messages.SUCCESS });

            } catch (error) {

                console.log(`disconnect error: ${error}`);
                socket.emit("error", messages.FAILED);

            }

        })

    });

}