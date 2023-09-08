const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");
const { USER_TYPE: { ADMIN, USER } } = require("../json/enums.json");

const {
  USER: { VALIDATOR, APIS },
} = require("../controllers");

const { upload } = require("../service/s3.upload")

const uploadImage = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "coverImage", maxCount: 1 },
])

/* Post Apis */
router.post("/signup", auth({ isTokenRequired: false, usersAllowed: [ADMIN] }), VALIDATOR.signup, APIS.signUp);
router.post("/signin", auth({ isTokenRequired: false, usersAllowed: ["*"] }), VALIDATOR.signIn, APIS.signIn);
router.post("/forgot", VALIDATOR.forgot, APIS.forgot);
router.post("/verifyOtp", VALIDATOR.verifyOtp, APIS.verifyOtp);
router.post("/verifyOtp/changePassword", auth({ usersAllowed: ["*"] }), VALIDATOR.afterOtpVerify, APIS.afterOtpVerify)
router.post("/changePassword", auth({ usersAllowed: ["*"] }), VALIDATOR.changePassword, APIS.changePassword);

/* Put Apis */
router.put("/update/:_id", uploadImage, auth({ usersAllowed: ["*"] }), VALIDATOR.update, APIS.update);
router.put("/toggleActive/:_id", auth({ usersAllowed: [ADMIN] }), VALIDATOR.toggleActive, APIS.delete)

/* Get Apis */
router.get("/get", auth({ usersAllowed: ["*"] }), VALIDATOR.fetch, APIS.getUser);
router.get("/dashboard", auth({ usersAllowed: [ADMIN] }), APIS.dashboardCounts);

module.exports = router;
