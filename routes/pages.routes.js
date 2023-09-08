const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { USER_TYPE: { ADMIN } } = require("../json/enums.json");

const { PAGES: { VALIDATOR, APIS } } = require("../controllers");

/* Post Apis */
router.post("/", auth({ usersAllowed: [ADMIN] }), VALIDATOR.create, APIS.createPages);

/* Get Apis */
router.get("/", auth({ usersAllowed: ["*"] }), VALIDATOR.fetch, APIS.getPages);

/* Put Apis */
router.put("/update/:_id", auth({ usersAllowed: [ADMIN] }), VALIDATOR.update, APIS.updatePages);
router.put("/delete/:_id", auth({ usersAllowed: [ADMIN] }), VALIDATOR.toggleActive, APIS.deletePages);

module.exports = router;

