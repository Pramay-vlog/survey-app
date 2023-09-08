const messages = require("../../json/message.json");
const DB = require("../../models");
const apiResponse = require("../../utils/api.response");
const { USER_TYPE: { ADMIN } } = require("../../json/enums.json");

/* APIS For Pages */
module.exports = exports = {

  /* Create Pages API */
  createPages: async (req, res) => {
    const pages = await DB.PAGES.create(req.body);
    return apiResponse.OK({ res, message: messages.SUCCESS, data: pages });
  },

  /* Get Pages API */
  getPages: async (req, res) => {
    let { page, limit, skip, sortBy, sortOrder, search, ...query } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 100;
    sortBy = sortBy || "createdAt";
    sortOrder = sortOrder || -1;

    query = req.user?.roleId.name === ADMIN ? { ...query } : { isActive: true, ...query };
    search ? query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ] : ""

    const pagess = await DB.PAGES
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .lean();

    return apiResponse.OK({ res, message: messages.SUCCESS, data: { count: await DB.PAGES.countDocuments(query), data: pagess } });
  },

  /* Update Pages API*/
  updatePages: async (req, res) => {
    let pagesExists = await DB.PAGES.findOne({ _id: req.params._id, isActive: true });
    if (!pagesExists) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

    await DB.PAGES.findByIdAndUpdate(req.params._id, req.body, { new: true, });
    return apiResponse.OK({ res, message: messages.SUCCESS });
  },

  /* Delete Pages API*/
  deletePages: async (req, res) => {
    let pagesExists = await DB.PAGES.findOne({ _id: req.params._id })
    if (!pagesExists) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

    await DB.PAGES.findByIdAndUpdate(req.params._id, { isActive: !pagesExists.isActive, });
    return apiResponse.OK({ res, message: messages.SUCCESS });
  },
};

