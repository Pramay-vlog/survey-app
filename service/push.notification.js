const admin = require('firebase-admin');
const serviceAccount = require("../config/fb.config.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


const sendNotification = async ({ deviceToken, notification }) => {
    try {
        if (Array.isArray(deviceToken) ? !deviceToken?.length : !deviceToken) {
            console.log(`No valid device tokens provided.`)
            return
        }

        const message = {
            notification: {
                title: notification.title,
                body: notification.body
            },
            token: deviceToken
        }
        await admin.messaging().send(message)
        console.log("Push Notification Success");

    } catch (e) {
        console.log("Push Notification Error", e);
    }

};

module.exports = { sendNotification }