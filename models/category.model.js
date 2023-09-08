const { Schema, model } = require("mongoose");

const categorySchema = new Schema(
    {
        name: { type: String },
        isActive: { type: Boolean, default: true }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

let categoryModel = model("category", categorySchema, "category");

module.exports = categoryModel;
