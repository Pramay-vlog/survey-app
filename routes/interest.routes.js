const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { USER_TYPE: { ADMIN, USER } } = require("../json/enums.json");

const {
  INTEREST: { VALIDATOR, APIS }
} = require("../controllers");

/* Post Apis */
router.post("/", auth({ usersAllowed: [ADMIN] }), VALIDATOR.create, APIS.createInterest);

/* Get Apis */
router.get("/", auth({ usersAllowed: ["*"] }), VALIDATOR.fetch, APIS.getInterest);

/* Put Apis */
router.put("/update/:_id", auth({ usersAllowed: ["*"] }), VALIDATOR.update, APIS.updateInterest);
router.put("/delete/:_id", auth({ usersAllowed: [ADMIN] }), VALIDATOR.toggleActive, APIS.deleteInterest);

module.exports = router;

