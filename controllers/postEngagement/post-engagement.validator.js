const Joi = require("joi");
const validator = require("../../middleware/validator");
module.exports = {
    create: validator({
        body: Joi.object({
            post_id: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .message("Invalid ID"),
            post_engagement_id: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .message("Invalid ID"),
            option_1: Joi.boolean().default(false),
            option_2: Joi.boolean().default(false),
            option_3: Joi.boolean().default(false),
            option_4: Joi.boolean().default(false),
            question: Joi.string().default(null),
            answer: Joi.string().default(null),
            answer_by: Joi.string(),
        }).or("post_id", "post_engagement_id")
    }),

    update: validator({
        body: Joi.object({
            option_1: Joi.string(),
            option_2: Joi.string(),
            option_3: Joi.string(),
            option_4: Joi.string(),
            answer: Joi.string(),
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
        query: Joi.object({
            isQa: Joi.string().valid("1", "0"),
            isBinary: Joi.string().valid("1", "0"),
            isAll: Joi.string().valid("1", "0"),
        }).or("isQa", "isBinary"),
    }),

    deleteAll: validator({
        body: Joi.object({
            data: Joi.array()
                .items(Joi.string()
                    .pattern(/^[0-9a-fA-F]{24}$/)
                    .message("Invalid ID")
                )
                .required(),
        }),
        query: Joi.object({
            isQa: Joi.string().valid("1", "0"),
            isBinary: Joi.string().valid("1", "0"),
        }).or("isQa", "isBinary"),
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
            postType: Joi.number(),
            answer_by: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .message("Invalid ID"),
            category_id: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .message("Invalid ID"),
            answer_by: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .message("Invalid ID"),
            asked_by: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .message("Invalid ID"),
            asked_by: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .message("Invalid ID"),
            user_post: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .message("Invalid ID"),
        }),
    }),

    fetchFilters: validator({
        query: Joi.object({
            page: Joi.number().default(1),
            limit: Joi.number().default(100),
            sortBy: Joi.string(),
            sortOrder: Joi.string(),
            skip: Joi.number(),
            search: Joi.string(),
            most_popular: Joi.boolean().valid(true, false),
            most_answered: Joi.boolean().valid(true, false),
            interests: Joi.boolean().valid(true, false),
        }),
    }),
};

