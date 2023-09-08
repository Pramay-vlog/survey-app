const messages = require("../../json/message.json");
const DB = require("../../models");
const apiResponse = require("../../utils/api.response");
const { USER_TYPE: { ADMIN } } = require("../../json/enums.json");

/* APIS For UserConnection */
module.exports = exports = {

    /* Create UserConnection API */
    createUserConnection: async (req, res) => {

        if (!await DB.USER.findById(req.body.follower_id).lean()) return apiResponse.BAD_REQUEST({ res, message: messages.NOT_FOUND });

        if (req.user._id.toString() === req.body.follower_id) return apiResponse.BAD_REQUEST({ res, message: messages.CANT_FOLLOW_YOURSELF });

        const followingUser = await DB.USERCONNECTION.findOne({ user_id: req.user._id, follower_id: req.body.follower_id }, { _id: 1 });

        if (followingUser) {

            await DB.USERCONNECTION.findByIdAndDelete(followingUser._id);
            return apiResponse.OK({ res, message: messages.UNFOLLOWED });

        } else {

            const userConnection = await DB.USERCONNECTION.create({ user_id: req.user._id, follower_id: req.body.follower_id });
            return apiResponse.OK({ res, message: messages.SUCCESS, data: userConnection });

        }

    },

    /* Get UserConnection API */
    getUserConnection: async (req, res) => {
        let { page, limit, skip, sortBy, sortOrder, search, ...query } = req.query;

        page = parseInt(page) || 1;
        limit = parseInt(limit) || 100;
        sortBy = sortBy || "createdAt";
        sortOrder = sortOrder || -1;

        const userConnections = await DB.USERCONNECTION
            .find(query)
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ [sortBy]: sortOrder })
            .populate([
                { path: "user_id", select: "name image" },
                { path: "follower_id", select: "name image" },
            ])
            .lean();

        return apiResponse.OK({ res, message: messages.SUCCESS, data: { count: await DB.USERCONNECTION.countDocuments(query), data: userConnections } });
    },

    /* Remove UserConnection API */
    removeUserConnection: async (req, res) => {

        const userConnection = await DB.USERCONNECTION.findById(req.params._id);
        if (!userConnection) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

        if (req.user._id.toString() !== userConnection.follower_id.toString()) return apiResponse.UNAUTHORIZED({ res, message: messages.UNAUTHORIZED })

        await DB.USERCONNECTION.findByIdAndDelete(req.params._id);
        return apiResponse.OK({ res, message: messages.FOLLOWER_REMOVED });

    }


};

