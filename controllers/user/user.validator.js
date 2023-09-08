const Joi = require("joi");
const validator = require("../../middleware/validator");
module.exports = {

    signup: validator({
        body: Joi.object({
            name: Joi.string(),
            outhType: Joi.number().valid(1, 2, 3).default(1).required(),
            email: Joi.string().when("outhType", { is: { $or: [1, 2] }, then: Joi.required() }),
            password: Joi.string().when("outhType", { is: 1, then: Joi.required() }),
            googleId: Joi.string().when("outhType", { is: 2, then: Joi.required() }),
            facebookId: Joi.string().when("outhType", { is: 3, then: Joi.required() }),
            roleId: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .required(),
            deviceToken: Joi.string().allow(null, ""),
            isAdmin: Joi.number().valid(0, 1).default(0).required(),
        }),
    }),


    signIn: validator({
        body: Joi.object({
            outhType: Joi.number().valid(1, 2, 3).default(1).required(),
            email: Joi.string().when("outhType", { is: { $or: [1, 2] }, then: Joi.required() }),
            googleId: Joi.string().when("outhType", { is: 2, then: Joi.required() }),
            facebookId: Joi.string().when("outhType", { is: 3, then: Joi.required() }),
            password: Joi.string().when("outhType", { is: 1, then: Joi.required() }),
            deviceToken: Joi.string().allow(null, ""),
        }),
    }),


    forgot: validator({
        body: Joi.object({
            email: Joi.string().required(),
        }),
    }),


    verifyOtp: validator({
        body: Joi.object({
            email: Joi.string().required(),
            otp: Joi.string().required(),
        }),
    }),


    afterOtpVerify: validator({
        body: Joi.object({
            password: Joi.string().required(),
        })
    }),


    changePassword: validator({
        body: Joi.object({
            oldPassword: Joi.string().required(),
            newPassword: Joi.string().required(),
        }),
    }),


    update: validator({
        body: Joi.object({
            email: Joi.string().allow(null, ''),
            name: Joi.string().allow(null, ''),
            userName: Joi.string().allow(null, ''),
            password: Joi.string().allow(null, ''),
            bio: Joi.string().allow(null, ''),
            link: Joi.string().allow(null, ''),
            phone: Joi.string().allow(null, ''),
            pronaunce: Joi.string().allow(null, ''),
            sex: Joi.string().allow(null, ''),
            city: Joi.string().allow(null, ''),
            image: Joi.string().allow(null, ''),
            coverImage: Joi.string().allow(null, ''),
            interests: Joi.any()
        }),
        params: Joi.object({
            _id: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .required(),
        }),
    }),


    toggleActive: validator({
        params: Joi.object({
            _id: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .message("Invalid ID")
                .required(),
        }),
    }),


    fetch: validator({
        query: Joi.object({
            _id: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .message("Invalid ID"),
            page: Joi.number().default(1),
            limit: Joi.number().default(100),
            sortBy: Joi.string().default('createdAt'),
            sortOrder: Joi.string().default('-1'),
            search: Joi.string(),
            name: Joi.string(),
            email: Joi.string(),
            isAll: Joi.string().valid('true', 'false').default('false'),
        }),
    }),

};
