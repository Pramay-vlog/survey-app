const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { USER_TYPE: { ADMIN, USER } } = require("../json/enums.json");

const {
  POSTCOMMENT: { VALIDATOR, APIS }, USERENGAGEMENT
} = require("../controllers");

/* Post Apis */
router.post("/", auth({ usersAllowed: [USER, ADMIN] }), VALIDATOR.create, APIS.createPostComment);

/* Get Apis */
router.get("/", auth({ usersAllowed: ["*"] }), VALIDATOR.fetch, APIS.getPostComment);

/* Put Apis */
router.put("/update/:_id", auth({ usersAllowed: ["*"] }), VALIDATOR.update, APIS.updatePostComment);
router.delete("/:_id", auth({ usersAllowed: [ADMIN, USER] }), VALIDATOR.toggleActive, APIS.deletePostComment);

module.exports = router;
