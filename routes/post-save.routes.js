const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { USER_TYPE: { ADMIN, USER } } = require("../json/enums.json");

const {
  POSTSAVE: { VALIDATOR, APIS }
} = require("../controllers");

/* Post Apis */
router.post("/", auth({ usersAllowed: [USER, ADMIN] }), VALIDATOR.create, APIS.createPostSave);

/* Get Apis */
router.get("/", auth({ usersAllowed: ["*"] }), VALIDATOR.fetch, APIS.getPostSave);

/* Delete Apis */
router.delete("/deleteAll", auth({ usersAllowed: ["*"] }), VALIDATOR.deleteMany, APIS.deleteAllPostSave);
router.delete("/:_id", auth({ usersAllowed: [ADMIN, USER] }), VALIDATOR.deleteOne, APIS.deletePostSave);


module.exports = router;


