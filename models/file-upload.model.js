const { Schema, model } = require("mongoose");

const fileUploadSchema = new Schema(
    {
        file: [{ type: String }],
        user_id: { type: Schema.Types.ObjectId, ref: "user", },
        isActive: { type: Boolean, default: true }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

let fileUploadModel = model("file_upload", fileUploadSchema, "file_upload");

module.exports = fileUploadModel;
