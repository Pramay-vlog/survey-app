const messages = require("../../json/message.json");
const DB = require("../../models");
const apiResponse = require("../../utils/api.response");
const { USER_TYPE: { ADMIN }, CATEGORY } = require("../../json/enums.json");
const { ObjectId } = require('mongodb');

/* APIS For UserEngagement */
module.exports = exports = {

    /* Create UserEngagement API */
    createUserEngagement: async (req, res) => {

        if (!(!req.body.post_id)) {

            const engagementExists = await DB.USERENGAGEMENT.findOne({ post_id: req.body.post_id, answer_by: req.user._id, isActive: true }).lean();
            const validateCategory = await DB.USERPOST.findOne({ _id: engagementExists?.post_id }).populate("category_id", "name").lean();
            if (validateCategory && validateCategory.category_id.name === CATEGORY.BINARY_DECISION) return apiResponse.BAD_REQUEST({ res, message: messages.POST_ENGAGEMENT_EXISTS });

            const postExists = await DB.USERPOST.findOne({ _id: req.body.post_id, isActive: true });
            if (!postExists) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

            let categoryExists = await DB.CATEGORY.findOne({ _id: postExists.category_id, isActive: true });
            if (!categoryExists) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

            if (categoryExists.name === CATEGORY.BINARY_DECISION && (!req.body.option_1 && !req.body.option_2 && !req.body.option_3 && !req.body.option_4)) return apiResponse.BAD_REQUEST({ res, message: messages.REQUIRED_FIELDS });

            if (categoryExists.name === CATEGORY.QA && !req.body.question) return apiResponse.BAD_REQUEST({ res, message: messages.REQUIRED_FIELDS });

        }

        if (!(!req.body.post_engagement_id)) {

            const postEngagementExists = await DB.USERENGAGEMENT.findOne({ _id: req.body.post_engagement_id, isActive: true });
            if (!postEngagementExists) return apiResponse.NOT_FOUND({ res, message: messages.POST_ENGAGEMENT_NOT_FOUND });

            const userPost = await DB.USERPOST.findOne({ _id: postEngagementExists.post_id, isActive: true });
            if (!userPost) return apiResponse.NOT_FOUND({ res, message: messages.POST_NOT_FOUND });

            if (req.user._id.toString() !== userPost.asked_by.toString()) return apiResponse.BAD_REQUEST({ res, message: messages.UNAUTHORIZED });
            if (!req.body.answer) return apiResponse.BAD_REQUEST({ res, message: messages.REQUIRED_FIELDS });
            if (postEngagementExists.answer_by.toString() === req.user._id.toString() && postEngagementExists.post_engagement_id !== null) return apiResponse.BAD_REQUEST({ res, message: messages.ANSWERED_ALREADY });

        }

        req.body.answer_by = req.user._id;
        await DB.USERENGAGEMENT.create(req.body);

        let postData = [
            { $match: { post_id: ObjectId(req.body?.post_id) } },
            { $lookup: { from: "user_post", localField: "post_id", foreignField: "_id", as: "post_id", }, },
            { $unwind: { path: "$post_id", preserveNullAndEmptyArrays: true, }, },
            {
                $lookup: {
                    from: "user", localField: "post_id.asked_by", foreignField: "_id", as: "post_id.asked_by",
                    pipeline: [{ $project: { name: 1, image: 1, }, }, { $match: { answer_by: req.user._id } }],
                },
            },
            { $unwind: { path: "$post_id.asked_by", preserveNullAndEmptyArrays: true, }, },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: "$post_id._id",
                    count_option_1: { $sum: { $cond: [{ $eq: ["$option_1", true], }, 1, 0,], }, },
                    count_option_2: { $sum: { $cond: [{ $eq: ["$option_2", true], }, 1, 0,], }, },
                    count_option_3: { $sum: { $cond: [{ $eq: ["$option_3", true], }, 1, 0,], }, },
                    count_option_4: { $sum: { $cond: [{ $eq: ["$option_4", true], }, 1, 0,], }, },
                    total_count: { $sum: 1, },
                    answer_by: { $push: "$answer_by", },
                    post_id: { $first: "$post_id", },
                    option_1: { $first: "$option_1", },
                    option_2: { $first: "$option_2", },
                    option_3: { $first: "$option_3", },
                    option_4: { $first: "$option_4", },
                    post_engagement_id: { $first: "$post_engagement_id", },
                    question: { $first: "$question", },
                    answer: { $first: "$answer", },
                    isActive: { $first: "$isActive" }
                },
            },
            {
                $project: {
                    _id: 1,
                    percentage_option_1: { $trunc: { $multiply: [{ $divide: ["$count_option_1", "$total_count",], }, 100,], }, },
                    percentage_option_2: { $trunc: { $multiply: [{ $divide: ["$count_option_2", "$total_count",], }, 100,], }, },
                    percentage_option_3: { $trunc: { $multiply: [{ $divide: ["$count_option_3", "$total_count",], }, 100,], }, },
                    percentage_option_4: { $trunc: { $multiply: [{ $divide: ["$count_option_4", "$total_count",], }, 100,], }, },
                    post_id: 1,
                    answer_by: 1,
                    option_1: 1,
                    option_2: 1,
                    option_3: 1,
                    option_4: 1,
                    post_engagement_id: 1,
                    question: 1,
                    answer: 1,
                    isActive: 1,
                },
            },
            {
                $addFields: { answer_by: { $cond: [{ $in: [req.user._id, "$answer_by",], }, req.user._id, null,], }, }
            },
        ]

        let engagementData = [
            { $match: { post_engagement_id: ObjectId(req.body.post_engagement_id) }, },
            { $lookup: { from: "post_engagement", localField: "post_engagement_id", foreignField: "_id", as: "post_engagement", }, },
            { $unwind: { path: "$post_engagement", preserveNullAndEmptyArrays: true, }, },
            { $lookup: { from: "user_post", localField: "post_engagement.post_id", foreignField: "_id", as: "post_id", }, },
            { $unwind: { path: "$post_id", preserveNullAndEmptyArrays: true, }, },
            {
                $lookup: {
                    from: "user", localField: "post_id.asked_by", foreignField: "_id", as: "post_id.asked_by",
                    pipeline: [{ $project: { name: 1, image: 1, }, }, { $match: { _id: req.user._id, }, },],
                },
            },
            { $unwind: { path: "$post_id.asked_by", preserveNullAndEmptyArrays: true, }, },
            {
                $group: {
                    _id: "$post_id._id", count_option_1: { $sum: { $cond: [{ $eq: ["$option_1", true], }, 1, 0,], }, },
                    count_option_2: { $sum: { $cond: [{ $eq: ["$option_2", true], }, 1, 0,], }, },
                    count_option_3: { $sum: { $cond: [{ $eq: ["$option_3", true], }, 1, 0,], }, },
                    count_option_4: { $sum: { $cond: [{ $eq: ["$option_4", true], }, 1, 0,], }, },
                    total_count: { $sum: 1, },
                    answer_by: { $push: "$answer_by", },
                    post_id: { $first: "$post_id", },
                    option_1: { $first: "$option_1", },
                    option_2: { $first: "$option_2", },
                    option_3: { $first: "$option_3", },
                    option_4: { $first: "$option_4", },
                    post_engagement_id: { $first: "$post_engagement_id", },
                    question: { $first: "$question", },
                    answer: { $first: "$answer", },
                    isActive: { $first: "$isActive", },
                },
            },
            {
                $project: {
                    _id: 1,
                    percentage_option_1: { $trunc: { $multiply: [{ $divide: ["$count_option_1", "$total_count",], }, 100,], }, },
                    percentage_option_2: { $trunc: { $multiply: [{ $divide: ["$count_option_2", "$total_count",], }, 100,], }, },
                    percentage_option_3: { $trunc: { $multiply: [{ $divide: ["$count_option_3", "$total_count",], }, 100,], }, },
                    percentage_option_4: { $trunc: { $multiply: [{ $divide: ["$count_option_4", "$total_count",], }, 100,], }, },
                    post_id: 1,
                    answer_by: 1,
                    option_1: 1,
                    option_2: 1,
                    option_3: 1,
                    option_4: 1,
                    post_engagement_id: 1,
                    question: 1,
                    answer: 1,
                    isActive: 1,
                },
            },
            { $addFields: { answer_by: { $cond: [{ $in: [req.user._id, "$answer_by",], }, req.user._id, null,], }, }, },
        ]

        let data;
        if (req.body?.post_id) data = postData;
        else if (req.body?.post_engagement_id) data = engagementData;

        let resData = await DB.USERENGAGEMENT.aggregate(data);

        return apiResponse.OK({ res, message: messages.SUCCESS, data: resData[0] });
    },

    /* Update UserEngagement API*/
    updateUserEngagement: async (req, res) => {
        let userEngagementExists = await DB.USERENGAGEMENT.findOne({ _id: req.params._id, isActive: true });
        if (!userEngagementExists) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

        await DB.USERENGAGEMENT.findByIdAndUpdate(req.params._id, req.body, { new: true, });
        return apiResponse.OK({ res, message: messages.SUCCESS });
    },

    /* Delete UserEngagement API*/
    deleteUserEngagement: async (req, res) => {

        if (req.query.isBinary === "1") {

            const userPostExists = await DB.USERPOST.findOne({ _id: req.params._id }, { _id: 1 }).lean();
            if (!userPostExists) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

            const engagementExists = await DB.USERENGAGEMENT.findOne({ post_id: userPostExists._id, answer_by: req.user._id }, { _id: 1, answer_by: 1 }).lean();

            if (engagementExists.answer_by.toString() !== req.user._id.toString()) return apiResponse.UNAUTHORIZED({ res, message: messages.UNAUTHORIZED });

            await DB.USERENGAGEMENT.findByIdAndDelete(engagementExists._id);

        }

        if (req.query.isQa === "1") {

            const userPostExists = await DB.USERENGAGEMENT.findOne({ _id: req.params._id, answer_by: req.user._id, post_engagement_id: null }, { _id: 1, answer_by: 1 }).lean();
            if (!userPostExists) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

            if (await DB.USERENGAGEMENT.findOne({ post_engagement_id: userPostExists._id }).lean()) await DB.USERENGAGEMENT.findOneAndDelete({ post_engagement_id: userPostExists._id });

            await DB.USERENGAGEMENT.findByIdAndDelete(userPostExists._id);

        }

        return apiResponse.OK({ res, message: messages.SUCCESS });
    },

    /* Delete all UserEngagement API */
    deleteAllUserEngagement: async (req, res) => {

        for (let i = 0; i < req.body.data.length; i++) {
            let data = req.body.data[i];

            let postExists;
            if (req.query.isBinary === "1") {
                postExists = await DB.USERENGAGEMENT.findOne({ post_id: data, answer_by: req.user._id }).lean();
            }
            if (req.query.isQa === "1") {
                postExists = await DB.USERENGAGEMENT.findOne({ _id: data, answer_by: req.user._id }).lean();
            }
            if (!postExists) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

            await DB.USERENGAGEMENT.findByIdAndDelete(postExists._id);
        }

        return apiResponse.OK({ res, message: messages.SUCCESS });

    },

    /* Get UserEngagement API */
    getUserEngagement: async (req, res) => {
        let { page, limit, skip, sortBy, sortOrder, user_post, answer_by, asked_by, category_id, postType, _id, search, ...query } = req.query;

        page = parseInt(page) || 1;
        limit = parseInt(limit) || 100;
        sortBy = sortBy || "post_engagement.createdAt";
        sortOrder = sortOrder || -1;
        skip = (page - 1) * limit;


        if (_id) query._id = ObjectId(_id);
        if (user_post) query['post_id._id'] = ObjectId(user_post);
        if (category_id) query['post_id.category_id'] = ObjectId(category_id)
        if (asked_by) query['post_id.asked_by'] = ObjectId(asked_by);
        if (answer_by) query.answer_by = ObjectId(answer_by);
        if (postType) query['post_id.postType'] = parseInt(postType);

        if (search) {
            query.$or = [{
                "post_id.asked_by.name": {
                    $regex: search, $options: "i",
                }
            }]
        }

        query = req.user?.roleId.name === ADMIN ? { ...query } : { isActive: true, ...query };

        const categoryExists = await DB.CATEGORY.findOne({ _id: category_id, isActive: true });
        if (!categoryExists) return apiResponse.NOT_FOUND({ res, message: messages.CATEGORY_NOT_FOUND });

        let data = [
            { $match: { post_engagement_id: { $eq: null, }, }, },
            { $lookup: { from: "user_post", localField: "post_id", foreignField: "_id", as: "post_id", }, },
            { $unwind: { path: "$post_id", preserveNullAndEmptyArrays: true, }, },
            { $lookup: { from: "post_engagement", localField: "_id", foreignField: "post_engagement_id", as: "post_answer", }, },
            { $lookup: { from: "user", localField: "post_id.asked_by", foreignField: "_id", as: "post_id.asked_by", pipeline: [{ $project: { name: 1, image: 1, }, },], }, },
            { $unwind: { path: "$post_id.asked_by", preserveNullAndEmptyArrays: true, }, },
            { $addFields: { post_answer: { $cond: [{ $gte: [{ $size: "$post_answer", }, 1,], }, "$post_answer", null,], }, }, },
            { $unwind: { path: "$post_answer", preserveNullAndEmptyArrays: true, } },
            ...(Object.keys(query).length ? [{ $match: { ...query, "post_id.isActive": true } }] : [{ $match: { "post_id.isActive": true } }]),
            {
                $facet: {
                    count: [{ $group: { _id: null, count: { $count: {}, }, }, },],
                    data: [{ $sort: { createdAt: -1, }, }, { $skip: skip }, { $limit: limit }],
                },
            },
            { $unwind: { path: "$count", preserveNullAndEmptyArrays: true, }, },
            { $addFields: { count: "$count.count", }, },
        ]


        const userEngagements = await DB.USERENGAGEMENT.aggregate(data);

        return apiResponse.OK({ res, message: messages.SUCCESS, data: userEngagements[0] });
    },

    /* user-post filters */
    userPostFilters: async (req, res) => {

        let { page, limit, skip, sortBy, sortOrder, most_popular, most_answered, interests, search } = req.query;

        page = parseInt(page) || 1;
        limit = parseInt(limit) || 100;
        sortBy = sortBy || "createdAt";
        sortOrder = sortOrder || -1;
        skip = (page - 1) * limit

        let criteria = { _id: { $ne: null } }

        if (search) {
            criteria.$or = [
                { "post_id.asked_by.name": { $regex: search, $options: "i", }, },
                { "post_id.description": { $regex: search, $options: "i", }, },
            ]
        }

        let userEngagements;

        if (most_popular === "true" || most_popular === true) {

            let data = [
                {
                    $lookup: {
                        from: "user_post", localField: "post_id", foreignField: "_id", as: "post_id",
                        pipeline: [{ $project: { asked_by: 1, description: 1 }, },],
                    },
                },
                { $unwind: { path: "$post_id", preserveNullAndEmptyArrays: true, }, },
                { $group: { _id: "$post_id._id", post_id: { $first: "$post_id", }, likes_count: { $count: {}, }, }, },
                {
                    $lookup: {
                        from: "user", localField: "post_id.asked_by", foreignField: "_id", as: "post_id.asked_by",
                        pipeline: [{ $project: { name: 1, image: 1 }, },],
                    },
                },
                { $unwind: { path: "$post_id.asked_by", preserveNullAndEmptyArrays: true, }, },
                { $match: criteria },
                { $sort: { likes_count: -1, }, },
                { $facet: { count: [{ $group: { _id: null, count: { $count: {}, }, }, },], data: [{ $limit: limit }, { $skip: skip }], }, },
                { $unwind: { path: "$count", preserveNullAndEmptyArrays: true, }, },
                { $addFields: { count: "$count.count", }, },
            ]

            userEngagements = await DB.POSTLIKE.aggregate(data);

        }

        if (most_answered === "true" || most_answered === true) {

            let data = [
                {
                    $lookup: {
                        from: "user_post", localField: "post_id", foreignField: "_id", as: "post_id",
                        pipeline: [{ $project: { asked_by: 1, description: 1 }, },],
                    },
                },
                { $unwind: { path: "$post_id", preserveNullAndEmptyArrays: true, }, },
                { $match: { answer: { $ne: null, } }, },
                { $group: { _id: "$post_id._id", post_id: { $first: "$post_id", }, answer_count: { $count: {}, }, }, },
                {
                    $lookup: {
                        from: "user", localField: "post_id.asked_by", foreignField: "_id", as: "post_id.asked_by",
                        pipeline: [{ $project: { name: 1, image: 1 }, },],
                    },
                },
                { $unwind: { path: "$post_id.asked_by", preserveNullAndEmptyArrays: true, }, },
                { $match: criteria },
                { $sort: { answer_count: -1, }, },
                { $facet: { count: [{ $group: { _id: null, count: { $count: {}, }, }, },], data: [{ $limit: limit }, { $skip: skip }], }, },
                { $unwind: { path: "$count", preserveNullAndEmptyArrays: true, }, },
                { $addFields: { count: "$count.count", }, },
            ]

            userEngagements = await DB.USERENGAGEMENT.aggregate(data);

        }

        if (interests === "true" || interests === true) {

            let data = [
                {
                    $lookup: {
                        from: "user_post", localField: "post_id", foreignField: "_id", as: "post_id",
                        pipeline: [{ $project: { asked_by: 1, description: 1 }, },],
                    },
                },
                { $unwind: { path: "$post_id", preserveNullAndEmptyArrays: true, }, },
                {
                    $lookup: {
                        from: "user", localField: "post_id.asked_by", foreignField: "_id", as: "post_id.asked_by",
                        pipeline: [{ $project: { name: 1, image: 1, interests: 1 }, },],
                    },
                },
                { $unwind: { path: "$post_id.asked_by", preserveNullAndEmptyArrays: true, }, },
                { $match: { "post_id.asked_by.interests": { $in: req.user.interests, }, answer: { $ne: null, } }, },
                { $match: criteria },
                { $group: { _id: "$post_id._id", post_id: { $first: "$post_id", }, answer_count: { $count: {}, }, }, },
                { $sort: { answer_count: -1, }, },
                { $facet: { count: [{ $group: { _id: null, count: { $count: {}, }, }, },], data: [{ $limit: limit }, { $skip: skip }], }, },
                { $unwind: { path: "$count", preserveNullAndEmptyArrays: true, }, },
                { $addFields: { count: "$count.count", }, },
            ]

            userEngagements = await DB.USERENGAGEMENT.aggregate(data);

        }


        return apiResponse.OK({ res, message: messages.SUCCESS, data: userEngagements ? userEngagements[0] : { data: [] } });

    },

};

