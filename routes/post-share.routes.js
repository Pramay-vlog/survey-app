const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { USER_TYPE: { ADMIN, USER } } = require("../json/enums.json");
const { POSTSHARE: { VALIDATOR, APIS } } = require("../controllers");


/* Post Apis */
router.post("/", auth({ usersAllowed: [USER, ADMIN] }), VALIDATOR.create, APIS.createPostShare);

/* Get Apis */
router.get("/", auth({ usersAllowed: ["*"] }), VALIDATOR.fetch, APIS.getPostShare);

/* Put Apis */
router.put("/update/:_id", auth({ usersAllowed: ["*"] }), VALIDATOR.update, APIS.updatePostShare);

/* Delete Apis */
router.delete("/deleteAll", auth({ usersAllowed: ["*"] }), VALIDATOR.deleteMany, APIS.deleteAllPostShare);
router.delete("/:_id", auth({ usersAllowed: [ADMIN, USER] }), VALIDATOR.deleteOne, APIS.deletePostShare);

module.exports = router;

