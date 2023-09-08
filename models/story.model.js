const { Schema, model } = require("mongoose");

const storySchema = new Schema(
    {
        image: { type: String },
        user_id: { type: Schema.Types.ObjectId, ref: "user" },
        isActive: { type: Boolean, default: true }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

let storyModel = model("story", storySchema, "story");

module.exports = storyModel;
