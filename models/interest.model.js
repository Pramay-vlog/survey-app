const { Schema, model } = require("mongoose");

const interestSchema = new Schema(
    {
        name: { type: String },
        isActive: { type: Boolean, default: true }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

let interestModel = model("interest", interestSchema, "interest");

module.exports = interestModel;
