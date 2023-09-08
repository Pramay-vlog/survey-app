const { Schema, model } = require("mongoose");

const postShareSchema = new Schema(
    {
        post_id: { type: Schema.Types.ObjectId, ref: "user_post" },
        user_id: { type: Schema.Types.ObjectId, ref: "user" },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

let postShareModel = model("post_share", postShareSchema, "post_share");

module.exports = postShareModel;
