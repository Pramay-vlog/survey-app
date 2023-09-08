const messages = require("../../json/message.json");
const DB = require("../../models");
const apiResponse = require("../../utils/api.response");
const { USER_TYPE: { ADMIN } } = require("../../json/enums.json");

/* APIS For Contact */
module.exports = exports = {

  /* Create Contact API */
  createContact: async (req, res) => {
    const contact = await DB.CONTACT.create(req.body);
    return apiResponse.OK({ res, message: messages.SUCCESS, data: contact });
  },

  /* Get Contact API */
  getContact: async (req, res) => {
    let { page, limit, skip, sortBy, sortOrder, search, ...query } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 100;
    sortBy = sortBy || "createdAt";
    sortOrder = sortOrder || -1;

    query = req.user?.roleId.name === ADMIN ? { ...query } : { isActive: true, ...query };
    search ? query.$or = [
      { first_name: { $regex: search, $options: "i" } },
      { last_name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { mobile: { $regex: search, $options: "i" } },
      { subject: { $regex: search, $options: "i" } },
      { message: { $regex: search, $options: "i" } },
    ] : ""

    const contacts = await DB.CONTACT
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .lean();

    return apiResponse.OK({ res, message: messages.SUCCESS, data: { count: await DB.CONTACT.countDocuments(query), data: contacts } });
  },

  /* Update Contact API*/
  updateContact: async (req, res) => {
    let contactExists = await DB.CONTACT.findOne({ _id: req.params._id, isActive: true });
    if (!contactExists) return apiResponse.NOT_FOUND({res, message: messages.NOT_FOUND});

    await DB.CONTACT.findByIdAndUpdate(req.params._id, req.body, { new: true, });
    return apiResponse.OK({ res, message: messages.SUCCESS });
  },

  /* Delete Contact API*/
  deleteContact: async (req, res) => {
    let contactExists = await DB.CONTACT.findOne({ _id: req.params._id })
    if (!contactExists) return apiResponse.NOT_FOUND({res, message: messages.NOT_FOUND});

    await DB.CONTACT.findByIdAndDelete(req.params._id);
    return apiResponse.OK({ res, message: messages.SUCCESS });
  },
};


