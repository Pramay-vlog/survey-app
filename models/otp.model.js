const { Schema, model } = require("mongoose");

const { USER_TYPE } = require("../json/enums.json");

let otpSchema = new Schema(
  {
    email: String,
    otp: String,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

let roleModel = model("otp", otpSchema, "otp");

module.exports = roleModel;
