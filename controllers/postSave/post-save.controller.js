const messages = require("../../json/message.json");
const DB = require("../../models");
const apiResponse = require("../../utils/api.response");
const { ObjectId } = require('mongodb');
const { CATEGORY: { BINARY_DECISION, QA }, USER_TYPE: { ADMIN, USER } } = require("../../json/enums.json");


/* APIS For PostSave */
module.exports = exports = {

    /* Create PostSave API */
    createPostSave: async (req, res) => {

        const postExists = await DB.USERPOST.findOne({ _id: req.body.post_id, isActive: true }).lean();
        if (!postExists) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

        const savedExists = await DB.POSTSAVE.findOne({ post_id: req.body.post_id, saved_by: req.user._id, isActive: true });

        if (savedExists) {

            await DB.POSTSAVE.findByIdAndDelete(savedExists._id);
            return apiResponse.OK({ res, message: messages.SUCCESS });

        } else {

            const postSave = await DB.POSTSAVE.create({ ...req.body, saved_by: req.user._id });
            return apiResponse.OK({ res, message: messages.SUCCESS, data: postSave });

        }

    },

    /* Get PostSave API */
    getPostSave: async (req, res) => {
        let { page, limit, skip, post_answer_page, post_answer_limit, post_answer_skip, sortBy, sortOrder, search, post_id, asked_by, saved_by, category_id, ...query } = req.query;

        page = parseInt(page) || 1;
        limit = parseInt(limit) || 100;
        skip = (page - 1) * limit;

        post_answer_page = parseInt(post_answer_page) || 1;
        post_answer_limit = parseInt(post_answer_limit) || 10;
        post_answer_skip = (post_answer_page - 1) * post_answer_limit;

        sortBy = sortBy || "createdAt";
        sortOrder = sortOrder || -1;

        if (post_id) query._id = ObjectId(post_id);
        if (asked_by) query['asked_by._id'] = ObjectId(asked_by);
        if (saved_by) query.saved_by = ObjectId(saved_by);
        if (category_id) query['post_id.category_id'] = ObjectId(category_id);

        query = req.user?.roleId.name === ADMIN ? { ...query } : { isActive: true, ...query };
        if (search) {
            query.$or = [
                { "post_id.asked_by.name": { $regex: search, $options: "i" } },
            ];
        }

        let data = [
            { $lookup: { from: "user_post", localField: "post_id", foreignField: "_id", as: "post_id", }, },
            { $unwind: { path: "$post_id", preserveNullAndEmptyArrays: true, }, },
            { $addFields: { _id: "$post_id._id", post_save_id: "$_id" }, },
            {
                '$lookup': {
                    'from': 'post_engagement', 'localField': '_id', 'foreignField': 'post_id', 'as': 'post_engagement',
                    'pipeline': [
                        {
                            '$group': {
                                '_id': '$post_id',
                                'count_option_1': { '$sum': { '$cond': [{ '$eq': ['$option_1', true] }, 1, 0] } },
                                'count_option_2': { '$sum': { '$cond': [{ '$eq': ['$option_2', true] }, 1, 0] } },
                                'count_option_3': { '$sum': { '$cond': [{ '$eq': ['$option_3', true] }, 1, 0] } },
                                'count_option_4': { '$sum': { '$cond': [{ '$eq': ['$option_4', true] }, 1, 0] } },
                                'total_count': { '$sum': 1 },
                                'answer_by': { '$push': '$answer_by' }
                            }
                        }, {
                            '$project': {
                                '_id': 1,
                                'percentage_option_1': { '$trunc': { '$multiply': [{ '$divide': ['$count_option_1', '$total_count'] }, 100] } },
                                'percentage_option_2': { '$trunc': { '$multiply': [{ '$divide': ['$count_option_2', '$total_count'] }, 100] } },
                                'percentage_option_3': { '$trunc': { '$multiply': [{ '$divide': ['$count_option_3', '$total_count'] }, 100] } },
                                'percentage_option_4': { '$trunc': { '$multiply': [{ '$divide': ['$count_option_4', '$total_count'] }, 100] } },
                                'answer_by': 1
                            }
                        }
                    ]
                }
            }, {
                '$unwind': { 'path': '$post_engagement', 'preserveNullAndEmptyArrays': true }
            }, {
                '$lookup': {
                    'from': 'user', 'localField': 'post_id.asked_by', 'foreignField': '_id', 'as': 'post_id.asked_by',
                    'pipeline': [{ '$project': { 'name': 1, 'image': 1 } }]
                }
            }, {
                '$unwind': { 'path': '$post_id.asked_by', 'preserveNullAndEmptyArrays': true }
            },
            ...(Object.keys(query).length ? [{ '$match': { ...query, 'post_id.isActive': true } },] : [{ '$match': { 'post_id.isActive': true } }]),
            {
                '$lookup': {
                    'from': 'post_like', 'localField': '_id', 'foreignField': 'post_id', 'as': 'post_likes',
                    'pipeline': [{ '$group': { '_id': '$isLiked', 'count': { '$count': {} }, 'data': { '$push': { '_id': '$_id', 'post_id': '$post_id', 'liked_by': '$liked_by' } } } }]
                }
            }, {
                '$unwind': { 'path': '$post_likes', 'preserveNullAndEmptyArrays': true }
            }, {
                '$addFields': { 'likes_count': { '$cond': [{ '$eq': ['$post_likes._id', null] }, { '$size': '$post_likes.data' }, 0] } }
            }, {
                '$lookup': { from: "post_like", localField: "_id", foreignField: "post_id", as: "is_post_liked", pipeline: [{ $match: { liked_by: req.user._id, }, },], }
            }, {
                '$lookup': {
                    'from': 'post_comment', 'localField': '_id', 'foreignField': 'post_id', 'as': 'post_comment',
                    'pipeline': [{ '$match': { 'isActive': true } }, { '$group': { '_id': null, 'count': { '$count': {} } } }]
                }
            }, {
                '$lookup': {
                    'from': 'post_save', 'localField': '_id', 'foreignField': 'post_id', 'as': 'post_save',
                    'pipeline': [
                        { '$match': { 'isActive': true } },
                        { '$group': { '_id': null, 'data': { '$push': { '_id': '$_id', 'saved_by': '$saved_by' } }, 'count': { '$count': {} } } }
                    ]
                }
            }, {
                '$unwind': { 'path': '$post_save', 'preserveNullAndEmptyArrays': true }
            }, {
                '$unwind': { 'path': '$post_comment', 'preserveNullAndEmptyArrays': true }
            }, {
                '$lookup': {
                    'from': 'post_engagement', 'localField': 'post_engagement._id', 'foreignField': 'post_id', 'as': 'post_answer',
                    'pipeline': [
                        {
                            '$lookup': { 'from': 'user_post', 'localField': 'post_id', 'foreignField': '_id', 'as': 'post_id' }
                        }, {
                            '$unwind': { 'path': '$post_id', 'preserveNullAndEmptyArrays': true }
                        }, {
                            '$lookup': { 'from': 'category', 'localField': 'post_id.category_id', 'foreignField': '_id', 'as': 'post_id.category_id' }
                        }, {
                            '$unwind': { 'path': '$post_id.category_id', 'preserveNullAndEmptyArrays': true }
                        }, {
                            '$lookup': { 'from': 'post_engagement', 'localField': '_id', 'foreignField': 'post_engagement_id', 'as': 'post_engagement_answers' }
                        }, {
                            '$match': { 'post_id.category_id.name': QA, 'post_id.isActive': true }
                        }, {
                            '$lookup': {
                                'from': 'post_like', 'localField': '_id', 'foreignField': 'post_engagement_id', 'as': 'post_likes',
                                'pipeline': [{ '$group': { '_id': '$isLiked', 'data': { '$push': '$$ROOT' } } }]
                            }
                        }, {
                            '$addFields': {
                                'dislike_count': {
                                    '$reduce': {
                                        'input': '$post_likes',
                                        'initialValue': 0,
                                        'in': { '$cond': [{ '$eq': ['$$this._id', false] }, { '$add': ['$$value', { '$size': '$$this.data' }] }, '$$value'] }
                                    }
                                },
                                'like_count': {
                                    '$reduce': {
                                        'input': '$post_likes',
                                        'initialValue': 0,
                                        'in': { '$cond': [{ '$eq': ['$$this._id', true] }, { '$add': ['$$value', { '$size': '$$this.data' }] }, '$$value'] }
                                    }
                                }
                            }
                        }, {
                            '$lookup': {
                                'from': 'post_like', 'localField': '_id', 'foreignField': 'post_engagement_id', 'as': 'user_post_likes',
                                'pipeline': [{ '$match': { 'liked_by': req.user._id, 'isLiked': true } }]
                            }
                        }, {
                            '$addFields': { 'isLiked': { '$cond': [{ '$eq': [{ '$size': '$user_post_likes' }, 0] }, null, true] } }
                        }, {
                            '$lookup': {
                                'from': 'post_like', 'localField': '_id', 'foreignField': 'post_engagement_id', 'as': 'user_post_dislikes',
                                'pipeline': [{ '$match': { 'liked_by': req.user._id, 'isLiked': false } }]
                            }
                        }, {
                            '$addFields': { 'isDisliked': { '$cond': [{ '$eq': [{ '$size': '$user_post_dislikes' }, 0] }, null, true] } }
                        }, {
                            '$project': { 'post_likes': 0, 'user_post_likes': 0, 'user_post_dislikes': 0 }
                        }
                    ]
                }
            }, {
                '$lookup': {
                    'from': 'post_share', 'localField': '_id', 'foreignField': 'post_id', 'as': 'post_share',
                    'pipeline': [{ '$group': { '_id': null, 'count': { '$count': {} } } }]
                }
            }, {
                '$unwind': { 'path': '$post_share', 'preserveNullAndEmptyArrays': true }
            }, {
                '$lookup': {
                    'from': 'user_connection', 'localField': 'post_id.asked_by._id', 'foreignField': 'follower_id', 'as': 'followings',
                    'pipeline': [{ '$match': { 'user_id': req.user._id } }]
                }
            }, {
                '$lookup': {
                    'from': 'post_engagement', 'localField': '_id', 'foreignField': 'post_id', 'as': 'poll_votes',
                    'pipeline': [
                        {
                            '$match': { 'answer_by': req.user._id, '$or': [{ 'option_1': true }, { 'option_2': true }, { 'option_3': true }, { 'option_4': true }] }
                        }, {
                            '$project': { 'option_1': 1, 'option_2': 1, 'option_3': 1, 'option_4': 1 }
                        }
                    ]
                }
            }, {
                '$unwind': { 'path': '$poll_votes', 'preserveNullAndEmptyArrays': true }
            }, {
                '$addFields': {
                    'comments_count': { '$ifNull': ['$post_comment.count', 0] },
                    'saved_count': { '$ifNull': ['$post_save.count', 0] },
                    'shared_count': { '$ifNull': ['$post_share.count', 0] },
                    'isFollowing': { '$cond': [{ '$eq': [{ '$size': '$followings' }, 0] }, false, true] },
                    isLiked: { $cond: [{ $eq: [{ $size: "$is_post_liked" }, 0] }, false, true,], },
                    isSaved: {
                        $anyElementTrue: {
                            $map: {
                                input: {
                                    $ifNull: ["$post_save.data", []],
                                },
                                as: "item",
                                in: {
                                    $eq: [
                                        "$$item.saved_by",
                                        req.user._id
                                    ],
                                },
                            },
                        },
                    },
                    'total_answers': {
                        '$reduce': {
                            'input': '$post_answer',
                            'initialValue': 0,
                            'in': { '$add': ['$$value', { '$cond': [{ '$gt': [{ '$size': '$$this.post_engagement_answers' }, 0] }, 1, 0] }] }
                        }
                    },
                    'post_engagement.isOption_1': '$poll_votes.option_1',
                    'post_engagement.isOption_2': '$poll_votes.option_2',
                    'post_engagement.isOption_3': '$poll_votes.option_3',
                    'post_engagement.isOption_4': '$poll_votes.option_4'
                }
            },
            {
                $project: {
                    _id: 1,
                    post_save_id: 1,
                    message: "$post_id.message",
                    description: "$post_id.description",
                    category_id: "$post_id.category_id",
                    asked_by: "$post_id.asked_by",
                    option_1: "$post_id.option_1",
                    option_2: "$post_id.option_2",
                    option_3: "$post_id.option_3",
                    option_4: "$post_id.option_4",
                    color_1: "$post_id.color_1",
                    color_2: "$post_id.color_2",
                    color_3: "$post_id.color_3",
                    color_4: "$post_id.color_4",
                    fontsize_1: "$post_id.fontsize_1",
                    fontsize_2: "$post_id.fontsize_2",
                    fontsize_3: "$post_id.fontsize_3",
                    fontsize_4: "$post_id.fontsize_4",
                    message_fontsize: "$post_id.message_fontsize",
                    gridType: "$post_id.gridType",
                    postType: "$post_id.postType",
                    optionsCount: "$post_id.optionsCount",
                    mediaFiles: "$post_id.mediaFiles",
                    saved_by: 1,
                    isActive: 1,
                    post_engagement: 1,
                    likes_count: 1,
                    comments_count: 1,
                    saved_count: 1,
                    shared_count: 1,
                    answers_count: "$total_answers",
                    isFollowing: 1,
                    isSaved: 1,
                    isLiked: 1,
                    post_engagement: 1,
                    post_answer: 1,
                    createdAt: 1,
                    updatedAt: 1,
                },
            },
            {
                '$addFields': { post_engagement: { $cond: [{ $eq: [{ $size: { $objectToArray: "$post_engagement", }, }, 0,], }, null, "$post_engagement",], }, }
            },
            {
                $facet: {
                    count: [{ $group: { _id: null, count: { $count: {}, }, }, },],
                    data: [{ '$sort': { [sortBy]: sortOrder } }, { '$skip': skip }, { '$limit': limit }],
                },
            },
            { $unwind: { path: "$count", preserveNullAndEmptyArrays: true, }, },
            { $addFields: { count: "$count.count", }, },
        ]


        const postSaves = await DB.POSTSAVE.aggregate(data)


        return apiResponse.OK({ res, message: messages.SUCCESS, data: postSaves[0] });
    },

    /* Delete post save */
    deletePostSave: async (req, res) => {

        const userPost = await DB.POSTSAVE.findOneAndDelete({ _id: req.params._id });
        if (!userPost) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });
        return apiResponse.OK({ res, message: messages.SUCCESS });

    },

    /* Delete All Post Save */
    deleteAllPostSave: async (req, res) => {

        if (req.query.isBinary === "true") {
            let category = await DB.CATEGORY.findOne({ name: BINARY_DECISION });
            let userPostSave = await DB.POSTSAVE
                .find({ saved_by: req.user._id })
                .populate([
                    { path: "post_id", match: { category_id: category._id } },
                ])
                .lean();
            userPostSave = userPostSave.filter((post) => post.post_id != null);
            for (let i = 0; i < userPostSave.length; i++) {
                await DB.POSTSAVE.findOneAndDelete({ _id: userPostSave[i]._id });
            }
        }
        if (req.query.isQa === "true") {
            let category = await DB.CATEGORY.findOne({ name: QA });

            let userPostSave = await DB.POSTSAVE
                .find({ saved_by: req.user._id })
                .populate([
                    { path: "post_id", match: { category_id: category._id } },
                ])
                .lean();
            userPostSave = userPostSave.filter((post) => post.post_id != null);

            for (let i = 0; i < userPostSave.length; i++) {
                await DB.POSTSAVE.findOneAndDelete({ _id: userPostSave[i]._id });
            }
        }
        return apiResponse.OK({ res, message: messages.SUCCESS });

    },

};


