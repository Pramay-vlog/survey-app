const { hash } = require("bcryptjs");
const { Schema, model } = require("mongoose");
const message = require("../json/message.json");

const userSchema = new Schema(
  {
    email: { type: String },
    name: { type: String, },
    userName: { type: String, },
    password: { type: String },
    outhType: { type: Number, default: 1 },
    googleId: { type: String },
    facebookId: { type: String },
    bio: { type: String },
    link: { type: String },
    phone: { type: String },
    pronaunce: { type: String },
    sex: { type: String },
    city: { type: String },
    interests: [{ type: Schema.Types.ObjectId, ref: "interest" }],
    image: { type: String, default: null },
    coverImage: { type: String, default: null },
    roleId: { type: Schema.Types.ObjectId, ref: "role" },
    isAdmin: { type: Number, default: 0 },
    socketId: { type: String, default: null },
    deviceToken: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.pre("save", async function (next) {
  try {
    const user = this;
    console.log("user.isModified(password)", user.isModified("password"), "user.isNew", user.isNew);
    if (user.isModified("password") || user.isNew) {
      this.password = await hash(user.password, 10);
      next();
    } else {
      next();
    }
  } catch (error) {
    console.log(message.passwordEncryptError, error);
  }
});

userSchema.set("toJSON", {
  transform: function (doc, ret, opt) {
    delete ret["password"];
    return ret;
  },
});

let userModel = model("user", userSchema, "user");
module.exports = userModel;