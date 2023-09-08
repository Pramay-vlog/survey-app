const { Schema, model } = require("mongoose");

const contactSchema = new Schema(
    {
        first_name: { type: String },
        last_name: { type: String },
        email: { type: String },
        mobile: { type: String },
        subject: { type: String },
        message: { type: String },
        isActive: { type: Boolean, default: true }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

let contactModel = model("contact", contactSchema, "contact");

module.exports = contactModel;

