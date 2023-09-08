const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { USER_TYPE: { ADMIN, USER } } = require("../json/enums.json");

const {
  USERENGAGEMENT: { VALIDATOR, APIS }
} = require("../controllers");

/* Post Apis */
router.post("/", auth({ usersAllowed: ["*"] }), VALIDATOR.create, APIS.createUserEngagement);

/* Get Apis */
router.get("/", auth({ usersAllowed: ["*"] }), VALIDATOR.fetch, APIS.getUserEngagement);
router.get("/filters", auth({ usersAllowed: ["*"] }), VALIDATOR.fetchFilters, APIS.userPostFilters);

/* Put Apis */
router.put("/update/:_id", auth({ usersAllowed: ["*"] }), VALIDATOR.update, APIS.updateUserEngagement);
router.put("/delete/:_id", auth({ usersAllowed: ["*"] }), VALIDATOR.toggleActive, APIS.deleteUserEngagement);

/* Delete Apis */
router.delete("/deleteAll", auth({ usersAllowed: ["*"] }), VALIDATOR.deleteAll, APIS.deleteAllUserEngagement);

module.exports = router;

