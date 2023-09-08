const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { USER_TYPE: { ADMIN, USER } } = require("../json/enums.json");

const {
  CONTACT: { VALIDATOR, APIS }
} = require("../controllers");

/* Post Apis */
router.post("/", auth({ isTokenRequired: false, usersAllowed: [USER] }), VALIDATOR.create, APIS.createContact);

/* Get Apis */
router.get("/", auth({ usersAllowed: [ADMIN] }), VALIDATOR.fetch, APIS.getContact);

/* Put Apis */
router.put("/:_id", auth({ usersAllowed: [ADMIN] }), VALIDATOR.update, APIS.updateContact);
router.delete("/:_id", auth({ usersAllowed: [ADMIN] }), VALIDATOR.toggleActive, APIS.deleteContact);

module.exports = router;
