const { Schema, model } = require("mongoose");

const userEngagementSchema = new Schema(
    {
        post_id: { type: Schema.Types.ObjectId, ref: "user_post", index: true },
        post_engagement_id: { type: Schema.Types.ObjectId, ref: "post_engagement", default: null, index: true },
        option_1: { type: Boolean },
        option_2: { type: Boolean },
        option_3: { type: Boolean },
        option_4: { type: Boolean },
        question: { type: String },
        answer: { type: String },
        answer_by: { type: Schema.Types.ObjectId, ref: "user" },
        isActive: { type: Boolean, default: true }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

let userEngagementModel = model("post_engagement", userEngagementSchema, "post_engagement");

module.exports = userEngagementModel;

