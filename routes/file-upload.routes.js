const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { FILEUPLOAD: { VALIDATOR, APIS } } = require("../controllers");
const { upload } = require("../service/s3.upload");

const uploadImage = upload.array("file");

/* Post Apis */
router.post("/", auth({ usersAllowed: ["*"] }), VALIDATOR.create, uploadImage, APIS.createFileUpload);

/* Get Apis */
router.get("/", auth({ usersAllowed: ["*"] }), VALIDATOR.fetch, APIS.getFileUpload);

/* Put Apis */
router.put("/update/:_id", auth({ usersAllowed: ["*"] }), VALIDATOR.update, uploadImage, APIS.updateFileUpload);
router.put("/delete/:_id", auth({ usersAllowed: ["*"] }), VALIDATOR.toggleActive, APIS.deleteFileUpload);

module.exports = router;
