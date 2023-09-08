const { Schema, model } = require("mongoose");

const chatSchecma = new Schema(
    {
        sender_id: { type: Schema.Types.ObjectId, ref: "user", },
        receiver_id: { type: Schema.Types.ObjectId, ref: "user", },
        room_id: { type: Schema.Types.ObjectId, ref: "chat_room" },
        message: { type: String },
        image: [{ type: String }],
        data_type: { type: String },
        isRead: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

let chatModel = model("chat", chatSchecma, "chat");

module.exports = chatModel;
