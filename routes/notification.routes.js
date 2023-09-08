const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { USER_TYPE: { ADMIN, USER } } = require("../json/enums.json");
const { NOTIFICATION: { VALIDATOR, APIS } } = require("../controllers");


/* Get Apis */
router.get("/", auth({ usersAllowed: ["*"] }), VALIDATOR.fetch, APIS.getNotification);

/* Put Apis */
router.put("/", auth({ usersAllowed: ["*"] }), VALIDATOR.update, APIS.updateNotification);

/* Delete Apis */
router.delete("/:_id", auth({ usersAllowed: ["*"] }), VALIDATOR.toggleActive, APIS.deleteNotification);

module.exports = router;
