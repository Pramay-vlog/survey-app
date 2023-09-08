const { Schema, model } = require("mongoose");

const postCommentSchema = new Schema(
    {
        message: { type: String },
        user_id: { type: Schema.Types.ObjectId, ref: "user" },
        post_id: { type: Schema.Types.ObjectId, ref: "user_post" },
        is_reply: { type: Number, default: 0 },
        reply_id: { type: Schema.Types.ObjectId, ref: "post_comment" },
        isActive: { type: Boolean, default: true }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

let postCommentModel = model("post_comment", postCommentSchema, "post_comment");

module.exports = postCommentModel;

