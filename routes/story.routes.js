const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { USER_TYPE: { ADMIN, USER } } = require("../json/enums.json");
const { STORY: { VALIDATOR, APIS } } = require("../controllers");
const { upload } = require("../service/s3.upload");;

const uploadImage = upload.single("image");

/* Post Apis */
router.post("/", auth({ usersAllowed: [USER, ADMIN] }), uploadImage, VALIDATOR.create, APIS.createStory);

/* Get Apis */
router.get("/", auth({ usersAllowed: ["*"] }), APIS.getStory);

/* Put Apis */
router.delete("/delete/:_id", auth({ usersAllowed: ["*"] }), VALIDATOR.toggleActive, APIS.deleteStory);

module.exports = router;
