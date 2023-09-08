const DB = require("../../models");
const messages = require("../../json/message.json");
const apiResponse = require("../../utils/api.response");

module.exports = {
    createRole: async (req, res) => {
        if (await DB.ROLE.findOne({ name: req.body.name })) return apiResponse.CONFLICT({ res, message: messages.ROLE_EXISTS });

        return apiResponse.OK({ res, message: messages.SUCCESS, data: await DB.ROLE.create(req.body) });
    },

    getRoles: async (req, res) => {
        return apiResponse.OK({ res, message: messages.SUCCESS, data: await DB.ROLE.find({ isActive: true }) });
    }
};
