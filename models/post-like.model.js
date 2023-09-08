const { Schema, model } = require("mongoose");

const postLikeSchema = new Schema(
    {
        post_id: { type: Schema.Types.ObjectId, ref: "user_post", default: null, index: true },
        post_engagement_id: { type: Schema.Types.ObjectId, ref: "post_engagement", default: null },
        post_comment_id: { type: Schema.Types.ObjectId, ref: "post_comment", default: null },
        isLiked: { type: Boolean, default: null },
        liked_by: { type: Schema.Types.ObjectId, ref: "user" },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

let postLikeModel = model("post_like", postLikeSchema, "post_like");

module.exports = postLikeModel;

