const messages = require("../../json/message.json");
const apiResponse = require("../../utils/api.response");
const DB = require("../../models");
const helper = require("../../utils/utils");
const EMAIL = require("../../service/mail.service")
const { USER_TYPE: { ADMIN } } = require("../../json/enums.json");
const { ObjectId } = require('mongodb');


module.exports = exports = {

    signIn: async (req, res) => {

        let criteria = {};


        if (req.body.outhType === 1 || req.body.outhType === 2) criteria = { email: req.body.email };
        if (req.body.outhType === 2) criteria = { googleId: req.body.googleId, email: req.body.email };
        if (req.body.outhType === 3) criteria = { facebookId: req.body.facebookId, $or: [{ email: req.body.email }] };


        let user = await DB.USER.findOne(criteria).populate("roleId", "name").lean();
        if (!user) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

        if (!user.isActive) return apiResponse.UNAUTHORIZED({ res, message: messages.INACTIVE_ACCOUNT });


        if (user.outhType === 1) {
            const isPasswordMatch = await helper.comparePassword({ password: req.body.password, hash: user.password });
            if (!isPasswordMatch) return apiResponse.BAD_REQUEST({ res, message: messages.INVALID_PASSWORD });
        }

        if ([req.body.deviceToken].filter(Boolean)) await DB.USER.findByIdAndUpdate(user._id, { deviceToken: req.body.deviceToken });

        const token = helper.generateToken({ data: { _id: user._id, role: user.roleId.name } });
        return apiResponse.OK({
            res,
            message: messages.SUCCESS,
            data: {
                _id: user._id,
                email: user?.email || null,
                name: user.name,
                role: user.roleId.name,
                token,
            },
        });
    },


    signUp: async (req, res) => {
        const roleData = await DB.ROLE.findById(req.body.roleId).lean();
        if (!roleData) return apiResponse.NOT_FOUND({ res, message: messages.INVALID_ROLE });
        req.body.roleId = roleData._id;


        /* validate admin for isAdmin 1 */
        if (req.body.isAdmin === 1) {
            if (!req.user) return apiResponse.UNAUTHORIZED({ res, message: messages.UNAUTHORIZED });
            if (roleData.name === ADMIN) return apiResponse.BAD_REQUEST({ res, message: messages.INVALID_ROLE });
        }


        /* find email or create password */
        if (req.body.outhType === 1) {
            if (await DB.USER.findOne({ email: req.body.email, outhType: 1 })) return apiResponse.DUPLICATE_VALUE({ res, message: messages.EMAIL_ALREADY_EXISTS });
        }


        /* find or create googleId*/
        if (req.body.outhType === 2) {
            if (await DB.USER.findOne({ email: req.body.email, googleId: req.body.googleId, outhType: 2 })) return apiResponse.DUPLICATE_VALUE({ res, message: messages.GOOGLE_ID_EXISTS })
        }


        /* find facebookId */
        if (req.body.outhType === 3) {
            if (await DB.USER.findOne({ facebookId: req.body.facebookId, outhType: 3, $or: [{ email: req.body.email }] })) return apiResponse.DUPLICATE_VALUE({ res, message: messages.FACEBOOK_ID_EXISTS })
        }

        let user = await DB.USER.create(req.body);
        user = await DB.USER.findById(user._id).populate("roleId", "name").lean();
        const token = helper.generateToken({ data: { _id: user._id, role: user.roleId.name } });


        return apiResponse.OK({
            res,
            message: messages.SUCCESS,
            data: {
                _id: user._id,
                email: user?.email || null,
                name: user.name,
                role: user.roleId.name,
                token,
            },
        });
    },


    forgot: async (req, res) => {
        const isUserExists = await DB.USER.findOne({ email: req.body.email, outhType: 1, isActive: true }).populate("roleId", "name").lean();
        if (!isUserExists) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

        const otp = await EMAIL.sendEmail({ to: req.body.email, name: isUserExists.name });
        console.log("otp ------", otp);
        await DB.OTP.findOneAndUpdate({ email: req.body.email }, { otp: otp }, { upsert: true, new: true });
        return apiResponse.OK({ res, message: messages.SUCCESS });
    },


    verifyOtp: async (req, res) => {


        const verify = await DB.OTP.findOne({ email: req.body.email, otp: req.body.otp }).lean();
        if (!verify) return apiResponse.BAD_REQUEST({ res, message: messages.NOT_FOUND });

        if (new Date(new Date().setSeconds(0, 0)).toISOString() > new Date(new Date(verify.updatedAt).getTime() + (1 * 60 * 60 * 1000)).toISOString()) {
            return apiResponse.BAD_REQUEST({ res, message: messages.OTP_EXPIRED });
        }

        await DB.OTP.findByIdAndDelete(verify._id)

        const user = await DB.USER.findOne({ email: req.body.email })
        const token = helper.generateToken({ data: { _id: user._id, role: user.roleId.name } });

        return apiResponse.OK({ res, message: messages.SUCCESS, data: token });
    },


    afterOtpVerify: async (req, res) => {
        const user = await DB.USER.findById(req.user._id);
        if (!user) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

        await DB.USER.findByIdAndUpdate(req.user._id, { password: await helper.hashPassword({ password: req.body.password }) })
        return apiResponse.OK({ res, message: messages.SUCCESS });
    },


    changePassword: async (req, res) => {
        const user = await DB.USER.findById(req.user._id);
        if (!user) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

        if (!await helper.comparePassword({ password: req.body.oldPassword, hash: user.password })) return apiResponse.BAD_REQUEST({ res, message: messages.INVALID_PASSWORD });

        await DB.USER.findByIdAndUpdate(req.user._id, { password: await helper.hashPassword({ password: req.body.newPassword }) });
        return apiResponse.OK({ res, message: messages.SUCCESS });
    },


    update: async (req, res) => {

        const user = await DB.USER.findById(req.params._id);
        if (!user) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

        if (req.user.roleId.name !== ADMIN) {
            if (req.user._id.toString() !== req.params._id) return apiResponse.UNAUTHORIZED({ res, message: messages.UNAUTHORIZED });
        }

        if (req.body.email) {

            if (await DB.USER.findOne({ _id: { $ne: user._id }, email: req.body.email }).lean()) return apiResponse.DUPLICATE_VALUE({ res, message: messages.EMAIL_ALREADY_EXISTS });

        }

        if (req.body.userName) {

            if (await DB.USER.findOne({ _id: { $ne: user._id }, userName: req.body.userName }).lean()) return apiResponse.DUPLICATE_VALUE({ res, message: messages.USER_NAME_EXISTS });

        }

        if (req.body.password) req.body.password = await helper.hashPassword({ password: req.body.password });

        if (req.body.interests) {

            req.body.interests = typeof req.body.interests === "string" ? JSON.parse(req.body.interests) : req.body.interests;

            for await (const interest of req.body.interests) {
                if (!await DB.INTEREST.findOne({ _id: interest, isActive: true })) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });
            }

        }

        if (req.files?.image?.length) req.body.image = req.files.image[0].location;
        if (req.files?.coverImage?.length) req.body.coverImage = req.files.coverImage[0].location;

        let data = await DB.USER.findByIdAndUpdate(req.params._id, req.body, { new: true });

        return apiResponse.OK({ res, message: messages.SUCCESS, data });
    },


    getUser: async (req, res) => {
        let { page, limit, skip, sortBy, sortOrder, search, isAll, ...query } = req.query;

        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;
        sortBy = sortBy || "createdAt";
        sortOrder = parseInt(sortOrder) || -1;
        skip = (page - 1) * limit;

        query = req.user.roleId.name === ADMIN ? { ...query } : isAll === 'true' ? { ...query, isActive: true } : { _id: req.user._id };

        search ? query.$or = [{ name: { $regex: search, $options: "i" } }] : "";

        if (query._id) query._id = ObjectId(query._id);

        let data = [
            {
                $lookup: {
                    from: "role", localField: "roleId", foreignField: "_id", as: "roleId",
                    pipeline: [{ $project: { name: 1, }, },],
                },
            },
            { $unwind: { path: "$roleId", preserveNullAndEmptyArrays: true, }, },
            {
                $lookup: {
                    from: "user_post", localField: "_id", foreignField: "asked_by", as: "user_posts",
                    pipeline: [{ $match: { isActive: true } }, { $group: { _id: null, count: { $count: {}, }, }, },],
                },
            },
            {
                $lookup: {
                    from: "user_connection", localField: "_id", foreignField: "follower_id", as: "followers",
                    pipeline: [{ $group: { _id: null, count: { $count: {}, }, }, },],
                },
            },
            {
                $lookup: {
                    from: "user_connection", localField: "_id", foreignField: "user_id", as: "followings",
                    pipeline: [{ $group: { _id: null, count: { $count: {}, }, }, },],
                },
            },
            {
                $addFields: {
                    user_posts: { $cond: [{ $eq: [{ $size: "$user_posts", }, 0,], }, 0, "$user_posts",], },
                    followers: { $cond: [{ $eq: [{ $size: "$followers", }, 0,], }, 0, "$followers",], },
                    followings: { $cond: [{ $eq: [{ $size: "$followings", }, 0,], }, 0, "$followings",], },
                },
            },
            { $unwind: { path: "$user_posts", preserveNullAndEmptyArrays: true, }, },
            { $unwind: { path: "$followers", preserveNullAndEmptyArrays: true, }, },
            { $unwind: { path: "$followings", preserveNullAndEmptyArrays: true, }, },
            {
                $addFields: {
                    user_posts: { $cond: [{ $eq: ["$user_posts", 0], }, 0, "$user_posts.count",], },
                    followers: { $cond: [{ $eq: ["$followers", 0], }, 0, "$followers.count",], },
                    followings: { $cond: [{ $eq: ["$followings", 0], }, 0, "$followings.count",], },
                },
            },
            ...(Object.keys(query).length ? [{ $match: { ...query }, },] : []),
            {
                $facet: {
                    count: [{ $group: { _id: null, count: { $count: {}, }, }, },],
                    data: [{ $sort: { [sortBy]: sortOrder, }, }, { $skip: skip, }, { $limit: limit, },],
                },
            },
            { $unwind: { path: "$count", preserveNullAndEmptyArrays: true, }, },
            { $addFields: { count: "$count.count", }, },
        ]

        const userData = await DB.USER.aggregate(data);

        return apiResponse.OK({ res, message: messages.SUCCESS, data: userData[0] });
    },


    dashboardCounts: async (req, res) => {
        const data = {
            user_count: await DB.USER.countDocuments(),
            role_count: await DB.ROLE.countDocuments(),
            post_count: await DB.USERPOST.countDocuments(),
            interest_count: await DB.INTEREST.countDocuments(),
            contacts_count: await DB.CONTACT.countDocuments(),
        }
        return apiResponse.OK({ res, message: messages.SUCCESS, data });
    },


    delete: async (req, res) => {
        const user = await DB.USER.findById(req.params._id);
        if (!user) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

        await DB.USER.findByIdAndUpdate(req.params._id, { isActive: !user.isActive }, { new: true });

        return apiResponse.OK({ res, message: messages.SUCCESS });
    }
};
