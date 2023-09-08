const Joi = require("joi");
const enums = require("../../json/enums.json");
const validator = require("../../middleware/validator");

module.exports = {
    create: validator({
        body: Joi.object({
            name: Joi.string().required().valid(...Object.values(enums.CATEGORY)),
        }),
    }),

    update: validator({
        body: Joi.object({
            name: Joi.string().valid(...Object.values(enums.CATEGORY)),
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


//* For Multer.
/* files: Joi.object({
    image: Joi.array().items(Joi.object().required()).required(),
}), */