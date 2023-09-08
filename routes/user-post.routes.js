const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { USER_TYPE: { ADMIN } } = require("../json/enums.json");
const { USERPOST: { VALIDATOR, APIS } } = require("../controllers");


const { upload, localUpload } = require("../service/s3.upload")
const uploadImage = upload.fields([
  { name: "mediaFiles", maxCount: 4 },
  { name: "thumbnail", maxCount: 4 },
]);
const localFile = localUpload.single("csv_sheet")


/* Post Apis */
router.post("/", auth({ usersAllowed: ["*"] }), uploadImage, VALIDATOR.create, APIS.createUserPost);
router.post("/dummy-data", auth({ usersAllowed: [ADMIN] }), localFile, APIS.createDummyUsers);

/* Get Apis */
router.get("/", auth({ usersAllowed: ["*"] }), VALIDATOR.fetch, APIS.getUserPost);

/* Put Apis */
router.put("/:_id", auth({ usersAllowed: ["*"] }), uploadImage, VALIDATOR.update, APIS.updateUserPost);
router.put("/delete/:_id", auth({ usersAllowed: ["*"] }), VALIDATOR.toggleActive, APIS.deleteUserPost);

module.exports = router;

