const { Schema, model } = require("mongoose");

const userConnectionSchema = new Schema(
    {
        user_id: { type: Schema.Types.ObjectId, ref: "user", index: true },
        follower_id: { type: Schema.Types.ObjectId, ref: "user", index: true },
        isActive: { type: Boolean, default: true }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

let userConnectionModel = model("user_connection", userConnectionSchema, "user_connection");

module.exports = userConnectionModel;