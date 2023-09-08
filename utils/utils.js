const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const DB = require("../models");
const { sendNotification } = require("../service/push.notification");

module.exports = {


    hashPassword: async ({ password }) => {

        const hash = await bcrypt.hash(password, 10);
        return hash;

    },


    generateToken: ({ data }) => {

        const token = jwt.sign(data, process.env.JWT_SECRET, /* { expiresIn: process.env.JWT_EXPIRES_IN } */);
        return token;

    },


    decodeToken: ({ token }) => {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;

    },


    comparePassword: async ({ password, hash }) => {

        const isPasswordMatch = await bcrypt.compare(password, hash);
        return isPasswordMatch;

    },


    sendNotification: async ({ req, postLikeId, isUpvote, postComment }) => {
        if (postLikeId) {
            const checkPostLike = await DB.POSTLIKE.findById(postLikeId).populate([
                { path: "post_id", select: "_id post_id mediaFiles", populate: { path: "asked_by", select: "deviceToken _id" } },
                { path: "post_engagement_id", select: "post_engagement_id", populate: { path: "post_id", select: "_id post_id mediaFiles", populate: { path: "asked_by", select: "deviceToken _id" } } },
                { path: "post_comment_id", select: "post_comment_id", populate: { path: "post_id", select: "_id post_id mediaFiles", populate: { path: "asked_by", select: "deviceToken _id" } } }
            ]).lean();

            /* Post Like */
            if (checkPostLike?.post_id) {

                let notification = {
                    title: "New Like",
                    body: `${req.user?.name} liked your post`
                }

                if (req.user._id.toString() !== checkPostLike?.post_id?.asked_by?._id.toString()) {

                    await DB.NOTIFICATION.create({ title: notification.title, body: notification.body, user_id: checkPostLike?.post_id?.asked_by._id, post_id: checkPostLike?.post_id._id, notification_by: req.user._id })
                    if (checkPostLike?.post_id?.asked_by?.deviceToken) {

                        await sendNotification({ deviceToken: checkPostLike?.post_id?.asked_by?.deviceToken, notification })

                    }

                }

            }

            /* QA Post Like */
            if (checkPostLike?.post_engagement_id) {

                let notification = {
                    title: "New Like",
                    body: isUpvote ? `${req.user?.name} liked your post` : `${req.user?.name} disliked your post`
                }

                if (req.user?._id.toString() !== checkPostLike?.post_engagement_id?.post_id?.asked_by?._id.toString()) {

                    await DB.NOTIFICATION.create({ title: notification.title, body: notification.body, user_id: checkPostLike?.post_engagement_id?.post_id?.asked_by._id, post_id: checkPostLike?.post_engagement_id?.post_id._id, notification_by: req.user._id })

                    if (checkPostLike?.post_engagement_id?.post_id?.asked_by?.deviceToken) {

                        await sendNotification({ deviceToken: checkPostLike?.post_engagement_id?.post_id?.asked_by?.deviceToken, notification })

                    }

                }

            }

            /* Post Comment Like */
            if (checkPostLike?.post_comment_id) {

                let notification = {
                    title: "New Like",
                    body: `${req.user?.name} liked on your comment`,
                }

                if (req.user._id.toString() !== checkPostLike?.post_comment_id?.post_id?.asked_by?._id.toString()) {

                    await DB.NOTIFICATION.create({ title: notification.title, body: notification.body, user_id: checkPostLike?.post_comment_id?.post_id?.asked_by?._id, post_id: checkPostLike?.post_comment_id?.post_id._id, notification_by: req.user._id })

                    if (checkPostLike?.post_comment_id?.post_id?.asked_by?.deviceToken) {

                        await sendNotification({ deviceToken: checkPostLike?.post_comment_id?.post_id?.asked_by?.deviceToken, notification })

                    }

                }

            }

        }

        /* Post Comment */
        if (postComment) {

            const postExists = await DB.USERPOST
                .findById(postComment)
                .populate([{ path: "asked_by", select: "deviceToken _id" },])
                .lean()
            if (!postExists) return

            if (req.user._id.toString() !== postExists?.asked_by?._id.toString()) {

                const notification = {
                    title: "New Comment",
                    body: `${req.user.name} commented on your post`
                }

                await sendNotification({ deviceToken: postExists?.asked_by?.deviceToken, notification })
                await DB.NOTIFICATION.create({ title: notification.title, body: notification.body, user_id: postExists?.asked_by?._id, post_id: postExists._id, notification_by: req.user._id })

            }

        }

        return true;

    }


};