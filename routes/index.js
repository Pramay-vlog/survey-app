const app = require("express")();

app.get("/", (req, res) => res.send("Welcome to Survey APIs!"));

app.use("/role", require("./role.routes"));
app.use("/user", require("./user.routes"));
app.use("/interest", require("./interest.routes"));
app.use("/user/connection", require("./user-connection.routes"));
app.use("/userPost", require("./user-post.routes"));
app.use("/category", require("./category.routes"));
app.use("/postEngagement", require("./post-engagement.routes"));
app.use("/postLike", require("./post-like.routes"));
app.use("/postComment", require("./post-comment.routes"));
app.use("/postSave", require("./post-save.routes"));
app.use("/contact", require("./contact.routes"));
app.use("/postShare", require("./post-share.routes"));
app.use("/pages", require("./pages.routes"));
app.use("/fileUpload", require("./file-upload.routes"));
app.use("/story", require("./story.routes"));
app.use("/notification", require("./notification.routes"));

module.exports = app;