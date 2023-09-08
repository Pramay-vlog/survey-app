const Joi = require("joi");
const validator = require("../../middleware/validator");
module.exports = {
    create: validator({
        body: Joi.object({
            message: Joi.string(),
            description: Joi.string(),
            category_id: Joi.string().required(),
            asked_by: Joi.string(),
            option_1: Joi.string(),
            option_2: Joi.string(),
            option_3: Joi.string(),
            option_4: Joi.string(),
            color_1: Joi.string(),
            color_2: Joi.string(),
            color_3: Joi.string(),
            color_4: Joi.string(),
            fontsize_1: Joi.string(),
            fontsize_2: Joi.string(),
            fontsize_3: Joi.string(),
            fontsize_4: Joi.string(),
            message_fontsize: Joi.string(),
            gridType: Joi.number().valid(1, 2, 3, 4).required(),
            postType: Joi.number().valid(1, 2, 3).required(),
            optionsCount: Joi.number().valid(2, 4),
            mediaFiles: Joi.array().items(Joi.object({
                type: Joi.string().valid("image", "video").required(),
                link: Joi.string().required(),
            })),
            thumbnail: Joi.array().items(Joi.string().required()),
        }),
    }),

    update: validator({
        body: Joi.object({
            message: Joi.string(),
            description: Joi.string(),
            option_1: Joi.string(),
            option_2: Joi.string(),
            option_3: Joi.string(),
            option_4: Joi.string(),
            color_1: Joi.string(),
            color_2: Joi.string(),
            color_3: Joi.string(),
            color_4: Joi.string(),
            fontsize_1: Joi.string(),
            fontsize_2: Joi.string(),
            fontsize_3: Joi.string(),
            fontsize_4: Joi.string(),
            mediaFiles: Joi.array().items(Joi.object({
                type: Joi.string().valid("image", "video").required(),
                link: Joi.string().required(),
            })),
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
            page: Joi.number(),
            limit: Joi.number(),
            post_answer_page: Joi.number(),
            post_answer_limit: Joi.number(),
            sortBy: Joi.string(),
            sortOrder: Joi.string(),
            message: Joi.string(),
            description: Joi.string(),
            postType: Joi.number().valid(1, 2, 3,),
            category_id: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .message("Invalid ID"),
            asked_by: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .message("Invalid ID"),
            answer_by: Joi.string()
                .pattern(/^[0-9a-fA-F]{24}$/)
                .message("Invalid ID"),
        }),
    }),
};

