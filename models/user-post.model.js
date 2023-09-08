const { Schema, model } = require("mongoose");

const userPostSchema = new Schema(
    {
        message: { type: String },
        description: { type: String, default: null },
        category_id: { type: Schema.Types.ObjectId, ref: "category", index: true },
        asked_by: { type: Schema.Types.ObjectId, ref: "user" },
        option_1: { type: String },
        option_2: { type: String },
        option_3: { type: String },
        option_4: { type: String },
        color_1: { type: String },
        color_2: { type: String },
        color_3: { type: String },
        color_4: { type: String },
        fontsize_1: { type: String, default: null },
        fontsize_2: { type: String, default: null },
        fontsize_3: { type: String, default: null },
        fontsize_4: { type: String, default: null },
        message_fontsize: { type: String, default: null },
        gridType: { type: Number, default: 1 },
        postType: { type: Number },
        optionsCount: { type: Number },
        mediaFiles: [
            {
                type: { type: String },
                link: { type: String },
                thumbnail: { type: String },
            },
        ],
        isActive: { type: Boolean, default: true }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

let userPostModel = model("user_post", userPostSchema, "user_post");

module.exports = userPostModel;

