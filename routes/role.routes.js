const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");
const { USER_TYPE } = require("../json/enums.json");

const {
  ROLE: { VALIDATOR, APIS },
} = require("../controllers");

/* Post Apis */
router.post("/", auth({ usersAllowed: [USER_TYPE.ADMIN], isTokenRequired: false }), VALIDATOR.createRole, APIS.createRole);
router.get("/", APIS.getRoles);

module.exports = router;
