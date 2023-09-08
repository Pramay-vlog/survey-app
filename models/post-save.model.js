const { Schema, model } = require("mongoose");

const postSaveSchema = new Schema(
    {
        post_id: { type: Schema.Types.ObjectId, ref: "user_post", index: true },
        saved_by: { type: Schema.Types.ObjectId, ref: "user" },
        isActive: { type: Boolean, default: true }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

let postSaveModel = model("post_save", postSaveSchema, "post_save");

module.exports = postSaveModel;

