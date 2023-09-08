const messages = require("../../json/message.json");
const DB = require("../../models");
const apiResponse = require("../../utils/api.response");
const { USER_TYPE: { ADMIN } } = require("../../json/enums.json");

/* APIS For Story */
module.exports = exports = {

  /* Create Story API */
  createStory: async (req, res) => {
    req.body.user_id = req.user._id;
    if (!req.file) return apiResponse.BAD_REQUEST({ res, message: messages.REQUIRED_FIELDS });

    req.body.image = req.file.location;

    const story = await DB.STORY.create(req.body);
    return apiResponse.OK({ res, message: messages.SUCCESS, data: story });
  },

  /* Get Story API */
  getStory: async (req, res) => {
    let { page, limit, sortBy, sortOrder, ...query } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 100;
    sortBy = sortBy || "createdAt";
    sortOrder = sortOrder || -1;

    query.createdAt = { $gte: new Date(new Date() - 24 * 60 * 60 * 1000) };

    let userData = [

      { $match: { _id: req.user._id }, },
      {
        $lookup: {
          from: "story", localField: "_id", foreignField: "user_id", as: "story",
          pipeline: [{ $match: { createdAt: { $gte: new Date(new Date() - 24 * 60 * 60 * 1000), }, }, },],
        },
      },
      { $addFields: { story: { $cond: [{ $eq: [{ $size: "$story", }, 0,], }, [], "$story",], }, }, },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name", },
          image: { $first: "$image", },
          story: { $first: "$story", },
        },
      },

    ]

    let remainingData = [

      { $lookup: { from: "story", localField: "_id", foreignField: "user_id", as: "story", }, },
      { $match: { story: { $gt: { $size: ["$story", 0], }, }, }, },
      { $unwind: { path: "$story", preserveNullAndEmptyArrays: true, }, },
      {
        $match: {
          _id: { $ne: req.user._id, },
          "story.createdAt": { $gte: new Date(new Date() - 24 * 60 * 60 * 1000) }
        },
      },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name", },
          image: { $first: "$image", },
          story: { $push: "$story", },
        },
      },

    ]

    const user = await DB.USER.aggregate(userData);
    console.log("user", user)
    const remaining = await DB.USER.aggregate(remainingData);
    let data = [...user, ...remaining];
    return apiResponse.OK({ res, message: messages.SUCCESS, data: { count: data.length, data } });
  },

  /* Delete Story API*/
  deleteStory: async (req, res) => {
    let storyExists = await DB.STORY.findOne({ _id: req.params._id })
    if (!storyExists) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });
    if (req.user.roleId.name !== ADMIN && storyExists.user_id.toString() !== req.user._id.toString()) return apiResponse.UNAUTHORIZED({ res, message: messages.UNAUTHORIZED });
    await DB.STORY.findByIdAndDelete(req.params._id, { isActive: false, });
    return apiResponse.OK({ res, message: messages.SUCCESS });
  },
};
