const { ROOM_TYPE } = require("../json/enums.json");
const mongoose = require("mongoose");


const chatRoomSchema = new mongoose.Schema(
    {
        sender_id: { type: mongoose.Schema.Types.ObjectId, ref: "user", },
        receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: "user", },
        room_type: { type: String, default: ROOM_TYPE.SINGLE },
        isActive: { type: Boolean, default: true },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

module.exports = mongoose.model("chat_room", chatRoomSchema, "chat_room");