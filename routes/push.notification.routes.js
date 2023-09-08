const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");

const { PUSHNOTIFICATION: { VALIDATOR, APIS } } = require("../controllers");

/* Post Apis */
router.post("/", auth({ usersAllowed: ["*"] }), VALIDATOR.create, APIS.sendPushNotification);

module.exports = router;

