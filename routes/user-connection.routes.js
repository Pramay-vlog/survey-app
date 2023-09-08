const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { USER_TYPE: { ADMIN, USER } } = require("../json/enums.json");

const {
  USERCONNECTION: { VALIDATOR, APIS }
} = require("../controllers");

/* Post Apis */
router.post("/", auth({ usersAllowed: ["*"] }), VALIDATOR.create, APIS.createUserConnection);

/* Get Apis */
router.get("/", auth({ usersAllowed: ["*"] }), VALIDATOR.fetch, APIS.getUserConnection);

/* Delete Apis */
router.delete("/:_id", auth({ usersAllowed: ["*"] }), VALIDATOR.remove, APIS.removeUserConnection);

module.exports = router;

