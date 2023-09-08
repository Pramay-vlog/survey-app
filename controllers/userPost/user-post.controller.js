const messages = require("../../json/message.json");
const DB = require("../../models");
const apiResponse = require("../../utils/api.response");
const { USER_TYPE: { ADMIN, USER }, CATEGORY } = require("../../json/enums.json");
const { ObjectId } = require('mongodb');
const csv = require("csvtojson")
const fs = require("fs");
const { CATEGORY: { BINARY_DECISION, QA } } = require("../../json/enums.json");
const ffmpeg = require('fluent-ffmpeg');


/* APIS For UserPost */
module.exports = exports = {

    /* Create UserPost API */
    createUserPost: async (req, res) => {

        const categoryExists = await DB.CATEGORY.findOne({ _id: req.body.category_id, isActive: true });
        if (!categoryExists) return apiResponse.NOT_FOUND({ res, message: messages.CATEGORY_NOT_FOUND });

        if ((req.body.postType === 1 || req.body.postType === 2) && categoryExists.name === CATEGORY.QA) {
            return apiResponse.BAD_REQUEST({ res, message: messages.INVALID_POST_TYPE });
        }

        if (req.body.postType === 3 && categoryExists.name === CATEGORY.BINARY_DECISION) {
            return apiResponse.BAD_REQUEST({ res, message: messages.INVALID_POST_TYPE });
        }

        if (categoryExists.name === CATEGORY.BINARY_DECISION) {
            if (

                (req.body.gridType === 2 || req.body.gridType === 3) && (!req.body.option_1 || !req.body.option_2) ||
                req.body.gridType === 4 && (!req.body.option_1 || !req.body.option_2 || !req.body.option_3 || !req.body.option_4) ||
                !req.body.optionsCount

            ) return apiResponse.BAD_REQUEST({ res, message: messages.OPTIONS_NOT_FOUND });
        }

        req.body.asked_by = req.user._id;

        let media = []
        if (req.files?.mediaFiles?.length) {
            media = req.files.mediaFiles.map(file => ({ type: file.contentType.split('/')[0], link: file.location }));
        }

        let _t_ = []
        if (req.files?.thumbnail?.length) {
            _t_ = req.files.thumbnail.map(file => file.location);
        }

        if (_t_.length) {
            let ti = 0
            for (let i = 0; i < media.length; i++) {
                if (media[i].type === "video") {
                    media[i].thumbnail = _t_[ti]
                    ti++
                }
            }
        }

        req.body.mediaFiles = media

        const userPost = await DB.USERPOST.create(req.body);
        return apiResponse.OK({ res, message: messages.SUCCESS, data: userPost });
    },

    /* Get UserPost API */
    getUserPost: async (req, res) => {
        let { page, limit, post_answer_page, post_answer_limit, post_answer_skip, skip, sortBy, sortOrder, search, asked_by, category_id, _id, answer_by, ...query } = req.query;

        page = +page || 1;
        limit = +limit || 10;
        skip = (page - 1) * limit;

        post_answer_page = parseInt(post_answer_page) || 1;
        post_answer_limit = parseInt(post_answer_limit) || 10;
        post_answer_skip = (post_answer_page - 1) * post_answer_limit;

        sortBy = sortBy || "createdAt";
        sortOrder = sortOrder || -1;

        query = req.user?.roleId.name === ADMIN ? { ...query } : { isActive: true, ...query };
        search ? query.$or = [
            { message: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            { "asked_by.name": { $regex: search, $options: "i" } },
        ] : ""

        if (_id) query._id = ObjectId(_id);
        if (asked_by) query['asked_by._id'] = ObjectId(asked_by);
        if (category_id) query.category_id = ObjectId(category_id);
        if (answer_by) query['post_engagement.answer_by'] = ObjectId(answer_by)

        let data = [
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
                    'from': 'user', 'localField': 'asked_by', 'foreignField': '_id', 'as': 'asked_by',
                    'pipeline': [{ '$project': { 'name': 1, 'image': 1 } }]
                }
            }, {
                '$unwind': { 'path': '$asked_by', 'preserveNullAndEmptyArrays': true }
            },
            ...(Object.keys(query).length ? [{ '$match': query },] : []),
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
                    'from': 'user_connection', 'localField': 'asked_by._id', 'foreignField': 'follower_id', 'as': 'followings',
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
            }, {
                '$group': {
                    '_id': '$_id',
                    'message': { '$first': '$message' },
                    'category_id': { '$first': '$category_id' },
                    'asked_by': { '$first': '$asked_by' },
                    'option_1': { '$first': '$option_1' },
                    'option_2': { '$first': '$option_2' },
                    'option_3': { '$first': '$option_3' },
                    'option_4': { '$first': '$option_4' },
                    'color_1': { '$first': '$color_1' },
                    'color_2': { '$first': '$color_2' },
                    'color_3': { '$first': '$color_3' },
                    'color_4': { '$first': '$color_4' },
                    'fontsize_1': { '$first': '$fontsize_1' },
                    'fontsize_2': { '$first': '$fontsize_2' },
                    'fontsize_3': { '$first': '$fontsize_3' },
                    'fontsize_4': { '$first': '$fontsize_4' },
                    'message_fontsize': { '$first': '$message_fontsize' },
                    'mediaFiles': { '$first': '$mediaFiles' },
                    'description': { '$first': '$description' },
                    'likes_count': { '$first': '$likes_count' },
                    'comments_count': { '$first': '$comments_count' },
                    'gridType': { '$first': '$gridType' },
                    'postType': { '$first': '$postType' },
                    'optionsCount': { '$first': '$optionsCount' },
                    'saved_count': { '$first': '$saved_count' },
                    'shared_count': { '$first': '$shared_count' },
                    'answers_count': { '$sum': '$total_answers' },
                    'isFollowing': { '$first': '$isFollowing' },
                    'isSaved': { '$first': '$isSaved' },
                    'isLiked': { '$first': '$isLiked' },
                    'isActive': { '$first': '$isActive' },
                    'post_engagement': { '$first': '$post_engagement' },
                    'post_answer': { '$first': '$post_answer' },
                    'createdAt': { '$first': '$createdAt' },
                    'updatedAt': { '$first': '$updatedAt' }
                }
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

        const userPosts = await DB.USERPOST.aggregate(data);

        return apiResponse.OK({ res, message: messages.SUCCESS, data: userPosts[0] });
    },

    /* Update UserPost API*/
    updateUserPost: async (req, res) => {
        let userPostExists = await DB.USERPOST.findOne({ _id: req.params._id, isActive: true });
        if (!userPostExists) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

        if (req.files?.length) {
            req.body.mediaFiles = req.files.map((file) => ({ type: file.contentType.split('/')[0], link: file.location, }));
        }

        await DB.USERPOST.findByIdAndUpdate(req.params._id, { $set: req.body }, { new: true, });
        return apiResponse.OK({ res, message: messages.SUCCESS });
    },

    /* Delete UserPost API*/
    deleteUserPost: async (req, res) => {
        let userPostExists = await DB.USERPOST.findOne({ _id: req.params._id })
        if (!userPostExists) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

        if (req.user.roleId.name !== ADMIN && req.user._id.toString() !== userPostExists.asked_by._id.toString()) {
            return apiResponse.UNAUTHORIZED({ res, message: messages.UNAUTHORIZED });
        }

        let update = await DB.USERPOST.findByIdAndUpdate(req.params._id, { isActive: !userPostExists.isActive, });
        if (!update.isActive) {
            await DB.USERENGAGEMENT.updateMany({ $and: [{ post_id: update._id }, { post_engagement_id: update._id }] }, { isActive: false })
            await DB.NOTIFICATION.updateMany({ post_id: update._id }, { isActive: false })
        }

        return apiResponse.OK({ res, message: messages.SUCCESS });
    },

    /* Dummy users with Post */
    createDummyUsers: async (req, res) => {

        let Data = [];

        if (!req?.file) return apiResponse.BAD_REQUEST({ res, message: messages.FILE_NOT_FOUND });

        csv().fromFile(req.file.path).then(async (jsonObj) => {

            for await (let data of jsonObj) {
                console.log("data", data)

                const userExists = await DB.USER.findOne({ $or: [{ email: data.email }, { userName: data.userName }] }).lean();

                const categoryExists = await DB.CATEGORY.findOne({ _id: data.category_id }).lean();

                let dataHeader = Object.keys(jsonObj[0]);
                let validHeaders = [
                    "email", "name", "userName", "message", "description", "category_id", "option_1", "option_2", "option_3", "option_4", "gridType", "postType", "optionsCount", "mediaFiles", "mediaType"
                ]

                const missingField = await dataHeader.find(item => !validHeaders.includes(item));
                if (missingField) return apiResponse.BAD_REQUEST({ res, message: messages.INVALID_FIELD + missingField })

                if (!userExists || categoryExists) Data.push(data)

            }

            const roleExists = await DB.ROLE.findOne({ name: USER }, { _id: 1 }).lean();

            let userPostData = [];
            for await (item of Data) {
                let userObj = {};
                let userPostObj = {};

                userObj.email = item.email;
                userObj.name = item?.name;
                userObj.userName = item.userName;
                userObj.password = "Dummy@123";
                userObj.outhType = 1
                userObj.isAdmin = 1
                userObj.roleId = roleExists._id;

                let userData = await DB.USER.create(userObj)

                userPostObj.message = item.message;
                userPostObj.description = item.description;
                userPostObj.category_id = item.category_id;
                userPostObj.asked_by = userData._id;
                userPostObj.option_1 = item.option_1 || null;
                userPostObj.option_2 = item.option_2 || null;
                userPostObj.option_3 = item.option_3 || null;
                userPostObj.option_4 = item.option_4 || null;
                userPostObj.gridType = item.gridType;
                userPostObj.postType = item.postType;
                userPostObj.optionsCount = item.optionsCount;
                userPostObj.mediaFiles = {
                    type: item.mediaType,
                    link: item.mediaFiles
                };

                userPostData.push(userPostObj);

            }

            await DB.USERPOST.insertMany(userPostData);
            fs.unlink(req.file.path, (error) => {
                if (error) console.log(`Error while unlinking file.`)
                return apiResponse.OK({ res, message: messages.SUCCESS })
            })


        })
    }
};


