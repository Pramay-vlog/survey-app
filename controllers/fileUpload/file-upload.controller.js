const messages = require("../../json/message.json");
const DB = require("../../models");
const apiResponse = require("../../utils/api.response");
const { USER_TYPE: { ADMIN } } = require("../../json/enums.json");

/* APIS For FileUpload */
module.exports = exports = {

  /* Create FileUpload API */
  createFileUpload: async (req, res) => {

    if (!req.files?.length) return apiResponse.BAD_REQUEST({ res, message: messages.REQUIRED_FIELDS });
    req.body.file = req.files.map(file => file.location)

    req.body.user_id = req.user._id;

    const fileUpload = await DB.FILEUPLOAD.create(req.body);
    return apiResponse.OK({ res, message: messages.SUCCESS, data: fileUpload });
  },

  /* Get FileUpload API */
  getFileUpload: async (req, res) => {
    let { page, limit, skip, sortBy, sortOrder, search, ...query } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 100;
    sortBy = sortBy || "createdAt";
    sortOrder = sortOrder || -1;

    query = req.user?.roleId.name === ADMIN ? { ...query } : { isActive: true, ...query };
    search ? query.$or = [{ file: { $regex: search, $options: "i" } }] : ""

    const fileUploads = await DB.FILEUPLOAD
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .lean();

    return apiResponse.OK({ res, message: messages.SUCCESS, data: { count: await DB.FILEUPLOAD.countDocuments(query), data: fileUploads } });
  },

  /* Update FileUpload API*/
  updateFileUpload: async (req, res) => {
    let fileUploadExists = await DB.FILEUPLOAD.findOne({ _id: req.params._id, isActive: true });
    if (!fileUploadExists) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

    if (req.body.file) req.body.file = req.file?.location;

    await DB.FILEUPLOAD.findByIdAndUpdate(req.params._id, req.body, { new: true, });
    return apiResponse.OK({ res, message: messages.SUCCESS });
  },

  /* Delete FileUpload API*/
  deleteFileUpload: async (req, res) => {
    let fileUploadExists = await DB.FILEUPLOAD.findOne({ _id: req.params._id })
    if (!fileUploadExists) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

    await DB.FILEUPLOAD.findByIdAndUpdate(req.params._id, { isActive: false, });
    return apiResponse.OK({ res, message: messages.SUCCESS });
  },
};

