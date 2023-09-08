const messages = require("../../json/message.json");
const DB = require("../../models");
const apiResponse = require("../../utils/api.response");
const { USER_TYPE: { ADMIN } } = require("../../json/enums.json");

module.exports = exports = {

  /* Get Notification API */
  getNotification: async (req, res) => {

    let { page, limit, skip, sortBy, sortOrder, search, ...query } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 100;
    sortBy = sortBy || "createdAt";
    sortOrder = sortOrder || -1;

    query = { isActive: true, user_id: req.user._id, ...query };

    const notification = await DB.NOTIFICATION
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .populate("user_id", "name image")
      .populate("notification_by", "name image")
      .populate("post_id", "mediaFiles")
      .lean();

    return apiResponse.OK({ res, message: messages.SUCCESS, data: { count: await DB.NOTIFICATION.countDocuments({ ...query, isRead: false }), data: notification } });
  },

  /* Update Notification API */
  updateNotification: async (req, res) => {

    let { page, limit, skip, sortBy, sortOrder, search, ...query } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 100;
    query = { isActive: true, user_id: req.user._id, isRead: false, ...query };

    const notification = await DB.NOTIFICATION.find(query).distinct('_id')

    await DB.NOTIFICATION.updateMany({ _id: { $in: notification } }, { isRead: true });
    return apiResponse.OK({ res, message: messages.SUCCESS });

  },

  /* Delete Notification API*/
  deleteNotification: async (req, res) => {
    let notificationExists = await DB.NOTIFICATION.findOne({ _id: req.params._id })
    if (!notificationExists) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

    await DB.NOTIFICATION.findByIdAndDelete(req.params._id);
    return apiResponse.OK({ res, message: messages.SUCCESS });
  },

};