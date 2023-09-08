const Joi = require("joi");
const validator = require("../../middleware/validator");
module.exports = {
    create: validator({
        body: Joi.object({
            first_name: Joi.string().required(),
            last_name: Joi.string().required(),
            email: Joi.string().required(),
            mobile: Joi.string().required().min(10).max(15),
            subject: Joi.string().required(),
            message: Joi.string().required(),
        }),
    }),

    update: validator({
        body: Joi.object({
            first_name: Joi.string(),
            last_name: Joi.string(),
            email: Joi.string(),
            mobile: Joi.string(),
            subject: Joi.string(),
            message: Joi.string(),
        }),
        params: Joi.object({
            _id: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .message("Invalid ID")
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
            search: Joi.string(),
            name: Joi.string(),
            page: Joi.number().default(1),
            limit: Joi.number().default(100),
            sortBy: Joi.string(),
            sortOrder: Joi.string(),
        }),
    }),
};
