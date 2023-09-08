const messages = require("../../json/message.json");
const DB = require("../../models");
const apiResponse = require("../../utils/api.response");
const { USER_TYPE: { ADMIN } } = require("../../json/enums.json");

/* APIS For Interest */
module.exports = exports = {

    /* Create Interest API */
    createInterest: async (req, res) => {
        const interestExists = await DB.INTEREST.findOne({name: req.body.name}).lean();
        if (interestExists) return apiResponse.DUPLICATE_VALUE({res, message: messages.INTEREST_EXISTS})

        const interest = await DB.INTEREST.create(req.body);
        return apiResponse.OK({ res, message: messages.SUCCESS, data: interest });
    },

    /* Get Interest API */
    getInterest: async (req, res) => {
        let { page, limit, skip, sortBy, sortOrder, search, ...query } = req.query;

        page = parseInt(page) || 1;
        limit = parseInt(limit) || 100;
        sortBy = sortBy || "createdAt";
        sortOrder = sortOrder || -1;

        query = req.user?.roleId.name === ADMIN ? { ...query } : { isActive: true, ...query };
        search ? query.$or = [{ name: { $regex: search, $options: "i" } }] : ""

        const interests = await DB.INTEREST
            .find(query)
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ [sortBy]: sortOrder })
            .lean();

        return apiResponse.OK({ res, message: messages.SUCCESS, data: { count: await DB.INTEREST.countDocuments(query), data: interests } });
    },

    /* Update Interest API*/
    updateInterest: async (req, res) => {
        let interestExists = await DB.INTEREST.findOne({ _id: req.params._id, isActive: true });
        if (!interestExists) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

        await DB.INTEREST.findByIdAndUpdate(req.params._id, req.body, { new: true, });
        return apiResponse.OK({ res, message: messages.SUCCESS });
    },

    /* Delete Interest API*/
    deleteInterest: async (req, res) => {
        let interestExists = await DB.INTEREST.findOne({ _id: req.params._id })
        if (!interestExists) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

        await DB.INTEREST.findByIdAndUpdate(req.params._id, { isActive: !interestExists.isActive, });
        return apiResponse.OK({ res, message: messages.SUCCESS });
    },
};

