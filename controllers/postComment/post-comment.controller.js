const messages = require("../../json/message.json");
const DB = require("../../models");
const apiResponse = require("../../utils/api.response");
const { USER_TYPE: { ADMIN, USER } } = require("../../json/enums.json");
const { ObjectId } = require('mongodb');
const { sendNotification } = require("../../utils/utils")

/* APIS For PostComment */
module.exports = exports = {

    /* Create PostComment API */
    createPostComment: async (req, res) => {
        const postExists = await DB.USERPOST.findById(req.body.post_id);
        if (!postExists) return apiResponse.NOT_FOUND({ res, message: messages.POST_NOT_FOUND });

        if (req.body.reply_id) {
            const commentExists = await DB.POSTCOMMENT.findById(req.body.reply_id);
            if (!commentExists) return apiResponse.NOT_FOUND({ res, message: messages.COMMENT_NOT_FOUND });
        }

        req.body.user_id = req.user._id;

        const postComment = await DB.POSTCOMMENT.create(req.body);
        if (req.body.is_reply === 0) await sendNotification({ req, postComment: postComment.post_id })
        return apiResponse.OK({ res, message: messages.SUCCESS, data: postComment });
    },

    /* Get PostComment API */
    getPostComment: async (req, res) => {
        let { page, limit, skip, sortBy, sortOrder, search, ...query } = req.query;

        page = parseInt(page) || 1;
        limit = parseInt(limit) || 100;
        sortBy = sortBy || "createdAt";
        sortOrder = sortOrder || -1;

        query = req.user?.roleId.name === ADMIN ? { ...query } : { isActive: true, ...query };

        let data = [
            { $match: { post_id: ObjectId(query.post_id), is_reply: 0, }, },
            {
                $lookup: {
                    from: "post_like", localField: "_id", foreignField: "post_comment_id", as: "comment_like",
                    pipeline: [{ $group: { _id: null, count: { $count: {}, }, }, },],
                },
            },
            { $unwind: { path: "$comment_like", preserveNullAndEmptyArrays: true, }, },
            {
                $lookup: {
                    from: "post_like", localField: "_id", foreignField: "post_comment_id", as: "liked_by",
                    pipeline: [{ $match: { liked_by: req.user._id, }, },],
                },
            },
            {
                $addFields: {
                    likes_count: "$comment_like.count",
                    isLiked: { $cond: [{ $eq: [{ $size: "$liked_by", }, 0,], }, false, true,], },
                },
            },
            {
                $lookup: {
                    from: "user", localField: "user_id", foreignField: "_id", as: "user_id",
                    pipeline: [{ $project: { name: 1, image: 1, }, },],
                },
            },
            { $unwind: { path: "$user_id", preserveNullAndEmptyArrays: true, }, },
            { $lookup: { from: "post_comment", localField: "_id", foreignField: "reply_id", as: "replies", }, },
            { $unwind: { path: "$replies", preserveNullAndEmptyArrays: true, }, },
            { $lookup: { from: "post_like", localField: "replies._id", foreignField: "post_comment_id", as: "replies.comment_like", }, },
            {
                $lookup: {
                    from: "post_like",
                    localField: "replies._id",
                    foreignField: "post_comment_id",
                    as: "replies.is_comment_like",
                    pipeline: [{ $match: { liked_by: req.user._id, }, },]
                },
            },
            {
                $addFields: {
                    "replies.likes_count": { $size: "$replies.comment_like", },
                    "replies.isLiked": { $cond: [{ $eq: [{ $size: "$replies.is_comment_like" }, 0,], }, false, true,], },
                },
            },
            {
                $lookup: {
                    from: "user", localField: "replies.user_id", foreignField: "_id", as: "replies.user_id",
                    pipeline: [{ $project: { name: 1, image: 1, }, },],
                },
            },
            { $unwind: { path: "$replies.user_id", preserveNullAndEmptyArrays: true, }, },
            { $project: { comment_like: 0, "replies.comment_like": 0, "replies.is_comment_like": 0, }, },
            {
                $group: {
                    _id: "$_id",
                    post_id: { $first: "$post_id", },
                    user_id: { $first: "$user_id", },
                    message: { $first: "$message", },
                    is_reply: { $first: "$is_reply", },
                    isLiked: { $first: "$isLiked", },
                    likes_count: { $first: "$likes_count", },
                    replies: { $push: { $cond: [{ $eq: ["$replies.reply_id", "$_id"], }, "$replies", "$$REMOVE",], }, },
                    createdAt: { $first: "$createdAt", },
                    updatedAt: { $first: "$updatedAt", },
                },
            },
            {
                $facet: {
                    count: [{ $group: { _id: null, count: { $count: {}, }, }, },],
                    data: [{ $sort: { [sortBy]: sortOrder, }, }, { $skip: (page - 1) * limit, }, { $limit: limit, },],
                },
            },
            { $unwind: { path: "$count", preserveNullAndEmptyArrays: true, }, },
            { $addFields: { count: "$count.count", }, },
        ]

        const postComments = await DB.POSTCOMMENT.aggregate(data);

        return apiResponse.OK({ res, message: messages.SUCCESS, data: postComments[0] });
    },

    /* Update PostComment API*/
    updatePostComment: async (req, res) => {
        let postCommentExists = await DB.POSTCOMMENT.findOne({ _id: req.params._id, isActive: true });
        if (!postCommentExists) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

        await DB.POSTCOMMENT.findByIdAndUpdate(req.params._id, req.body, { new: true, });
        return apiResponse.OK({ res, message: messages.SUCCESS });
    },

    /* Delete PostComment API*/
    deletePostComment: async (req, res) => {
        let postCommentExists = await DB.POSTCOMMENT.findOne({ _id: req.params._id }).populate([
            { path: "post_id", select: "asked_by", populate: { path: "asked_by", select: "_id" } }
        ]).lean();
        if (!postCommentExists) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

        if (
            req.user.roleId.name === USER &&
            postCommentExists.post_id.asked_by._id.toString() !== req.user._id.toString() &&
            postCommentExists.user_id.toString() !== req.user._id.toString()
        ) {
            return apiResponse.UNAUTHORIZED({ res, message: messages.UNAUTHORIZED });
        }

        await DB.POSTCOMMENT.deleteMany({ reply_id: req.params._id })
        await DB.POSTCOMMENT.findByIdAndDelete(req.params._id);
        return apiResponse.OK({ res, message: messages.SUCCESS });
    },
};


