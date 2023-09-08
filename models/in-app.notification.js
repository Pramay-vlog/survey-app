const { Schema, model } = require("mongoose");

const inAppNotificationSchema = new Schema(
    {
        title: { type: String },
        body: { type: String },
        user_id: { type: Schema.Types.ObjectId, ref: "user", },
        notification_by: { type: Schema.Types.ObjectId, ref: "user", },
        post_id: { type: Schema.Types.ObjectId, ref: "user_post" },
        isRead: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

let inAppNotificationModel = model("notification", inAppNotificationSchema, "notification");

module.exports = inAppNotificationModel;
