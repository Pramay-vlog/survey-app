const { Schema, model } = require("mongoose");

const pagesSchema = new Schema(
    {
        type: { type: String },
        title: { type: String },
        description: { type: String },
        isActive: { type: Boolean, default: true }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

let pagesModel = model("pages", pagesSchema, "pages");

module.exports = pagesModel;
