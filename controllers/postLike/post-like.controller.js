const messages = require("../../json/message.json");
const DB = require("../../models");
const apiResponse = require("../../utils/api.response");
const { CATEGORY } = require("../../json/enums.json");
const { sendNotification } = require("../../utils/utils");
const { ObjectId } = require("mongoose").Types

/* APIS For PostLike */
module.exports = exports = {

    /* Create PostLike API */
    createPostLike: async (req, res) => {

        /* Post Like */
        if (req.body.post_id) {

            const postExists = await DB.USERPOST.findById(req.body.post_id).populate("category_id", "name").lean();
            if (!postExists) return apiResponse.NOT_FOUND({ res, message: messages.POST_NOT_FOUND });

            const postLikeExists = await DB.POSTLIKE.findOne({ post_id: req.body.post_id, liked_by: req.user._id }).lean();

            if (postLikeExists) {

                await DB.POSTLIKE.findOneAndDelete({ post_id: req.body.post_id })
                return apiResponse.OK({ res, message: messages.SUCCESS });

            } else {
                const postLike = await DB.POSTLIKE.create({ ...req.body, liked_by: req.user._id });
                await sendNotification({ req, postLikeId: postLike._id })
                return apiResponse.OK({ res, message: messages.SUCCESS, data: postLike });

            }

        }

        /* QA Post Like */
        if (req.body.post_engagement_id) {
            const engagementExists = await DB.USERENGAGEMENT.findById(req.body.post_engagement_id).lean();
            if (!engagementExists) return apiResponse.NOT_FOUND({ res, message: messages.POST_ENGAGEMENT_NOT_FOUND });

            const postExists = await DB.USERPOST.findById(engagementExists?.post_id).populate("category_id", "name").lean();
            if (!postExists) return apiResponse.NOT_FOUND({ res, message: messages.POST_NOT_FOUND });

            if (postExists.category_id.name !== CATEGORY.QA) return apiResponse.BAD_REQUEST({ res, message: messages.POST_NOT_FOUND });

            let bool = [true, false]
            if (!bool.includes(req.body.isLiked)) return apiResponse.BAD_REQUEST({ res, message: messages.REQUIRED_FIELDS });

            const postLikeExists = await DB.POSTLIKE.findOne({
                $and: [
                    { post_engagement_id: req.body.post_engagement_id },
                    { liked_by: req.user._id },
                    { isLiked: req.body.isLiked },
                ]
            }).lean();

            if (!!postLikeExists) {

                await DB.POSTLIKE.findOneAndDelete({ _id: postLikeExists._id })
                return apiResponse.OK({ res, message: messages.SUCCESS });

            } else {

                const postLike = await DB.POSTLIKE.findOneAndUpdate({ post_engagement_id: req.body.post_engagement_id, liked_by: req.user._id }, { ...req.body, liked_by: req.user._id }, { new: true, upsert: true }).lean();

                if (postLike.isLiked) {
                    await sendNotification({ req, postLikeId: postLike._id, isUpvote: true })
                } else {
                    await sendNotification({ req, postLikeId: postLike._id, isUpvote: false })
                }

                let data = [
                    { $match: { post_engagement_id: ObjectId(req.body.post_engagement_id), }, },
                    { $lookup: { from: "post_engagement", localField: "post_engagement_id", foreignField: "_id", as: "post_engagement_id", }, },
                    { $unwind: { path: "$post_engagement_id", preserveNullAndEmptyArrays: true, }, },
                    { $addFields: { isUserLiked: { $cond: [{ $and: [{ $eq: ["$liked_by", req.user._id,], }, { $eq: ["$isLiked", true], },], }, true, false,], }, }, },
                    { $group: { _id: "$isLiked", data: { $push: "$$ROOT", }, }, },
                    {
                        $project: {
                            likesCount: { $cond: [{ $eq: ["$_id", true], }, { $size: "$data", }, 0,], },
                            dislikesCount: { $cond: [{ $eq: ["$_id", false], }, { $size: "$data", }, 0,], },
                        },
                    },
                    { $group: { _id: null, likesCount: { $sum: "$likesCount", }, dislikesCount: { $sum: "$dislikesCount", }, }, },
                ]

                const postLikesCount = await DB.POSTLIKE.aggregate(data)

                return apiResponse.OK({ res, message: messages.SUCCESS, data: { ...postLike, likesCount: postLikesCount[0]?.likesCount, dislikesCount: postLikesCount[0]?.dislikesCount } });

            }

        }

        /* Post Comment Like */
        let likeExists;
        if (req.body.post_comment_id) {
            const postExists = await DB.POSTCOMMENT.findById(req.body.post_comment_id);
            if (!postExists) return apiResponse.NOT_FOUND({ res, message: messages.COMMENT_NOT_FOUND });

            likeExists = await DB.POSTLIKE.findOne({ post_comment_id: req.body.post_comment_id, liked_by: req.user._id }).lean();
        }

        if (likeExists) {

            await DB.POSTLIKE.findByIdAndDelete(likeExists._id);
            return apiResponse.OK({ res, message: messages.SUCCESS });

        } else {

            const postLike = await DB.POSTLIKE.create({ ...req.body, liked_by: req.user._id });
            await sendNotification({ req, postLikeId: postLike._id })
            return apiResponse.OK({ res, message: messages.SUCCESS, data: postLike });

        }

    },

    /* Get PostLike API */
    getPostLike: async (req, res) => {
        let { page, limit, skip, sortBy, sortOrder, search, ...query } = req.query;

        page = parseInt(page) || 1;
        limit = parseInt(limit) || 100;
        sortBy = sortBy || "createdAt";
        sortOrder = sortOrder || -1;

        const postLikes = await DB.POSTLIKE
            .find(query)
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ [sortBy]: sortOrder })
            .populate([
                { path: "liked_by", select: "name image" },
            ])
            .lean();

        return apiResponse.OK({ res, message: messages.SUCCESS, data: { count: await DB.POSTLIKE.countDocuments(query), data: postLikes } });
    },

};

