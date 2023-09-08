const Joi = require("joi");
const validator = require("../../middleware/validator");
const { PAGE_TYPE } = require("../../json/enums.json");

module.exports = {
    create: validator({
        body: Joi.object({
            type: Joi.string().valid(...Object.values(PAGE_TYPE)).required(),
            title: Joi.string(),
            description: Joi.string().required(),
        }),
    }),

    update: validator({
        body: Joi.object({
            type: Joi.string().valid(...Object.values(PAGE_TYPE)),
            title: Joi.string(),
            description: Joi.string(),
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
            isActive: Joi.boolean(),
            title: Joi.string(),
            description: Joi.string(),
            page: Joi.number().default(1),
            limit: Joi.number().default(100),
            sortBy: Joi.string(),
            sortOrder: Joi.string(),
            type: Joi.string().valid(...Object.values(PAGE_TYPE)),
        }),
    }),
};
