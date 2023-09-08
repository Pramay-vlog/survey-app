const messages = require("../../json/message.json");
const DB = require("../../models");
const apiResponse = require("../../utils/api.response");
const { USER_TYPE: { ADMIN } } = require("../../json/enums.json");

/* APIS For Category */
module.exports = exports = {

    /* Create Category API */
    createCategory: async (req, res) => {
        const categoryExists = await DB.CATEGORY.findOne({ name: req.body.name, isActive: true });
        if (categoryExists) return apiResponse.BAD_REQUEST({ res, message: messages.CATEGORY_EXISTS });

        const category = await DB.CATEGORY.create(req.body);
        return apiResponse.OK({ res, message: messages.SUCCESS, data: category });
    },

    /* Get Category API */
    getCategory: async (req, res) => {
        let { page, limit, skip, sortBy, sortOrder, search, ...query } = req.query;

        page = parseInt(page) || 1;
        limit = parseInt(limit) || 100;
        sortBy = sortBy || "createdAt";
        sortOrder = sortOrder || -1;

        query = req.user?.roleId.name === ADMIN ? { ...query } : { isActive: true, ...query };
        search ? query.$or = [{ name: { $regex: search, $options: "i" } }] : ""

        const categorys = await DB.CATEGORY
            .find(query)
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ [sortBy]: sortOrder })
            .lean();

        return apiResponse.OK({ res, message: messages.SUCCESS, data: { count: await DB.CATEGORY.countDocuments(query), data: categorys } });
    },

    /* Update Category API*/
    updateCategory: async (req, res) => {
        let categoryExists = await DB.CATEGORY.findOne({ _id: req.params._id, isActive: true });
        if (!categoryExists) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

        await DB.CATEGORY.findByIdAndUpdate(req.params._id, req.body, { new: true, });
        return apiResponse.OK({ res, message: messages.SUCCESS });
    },

    /* Delete Category API*/
    deleteCategory: async (req, res) => {
        let categoryExists = await DB.CATEGORY.findOne({ _id: req.params._id })
        if (!categoryExists) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

        await DB.CATEGORY.findByIdAndUpdate(req.params._id, { isActive: false, });
        return apiResponse.OK({ res, message: messages.SUCCESS });
    },
};


