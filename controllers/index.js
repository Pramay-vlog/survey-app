module.exports = {
  ROLE: {
    APIS: require("./role/role.controller"),
    VALIDATOR: require("./role/role.validator"),
  },
  USER: {
    APIS: require("./user/user.controller"),
    VALIDATOR: require("./user/user.validator"),
  },
  INTEREST: {
    APIS: require("./interest/interest.controller"),
    VALIDATOR: require("./interest/interest.validator"),
  },
  USERCONNECTION: {
    APIS: require("./userConnection/user-connection.controller"),
    VALIDATOR: require("./userConnection/user-connection.validator"),
  },
  USERPOST: {
    APIS: require("./userPost/user-post.controller"),
    VALIDATOR: require("./userPost/user-post.validator"),
  },
  CATEGORY: {
    APIS: require("./category/category.controller"),
    VALIDATOR: require("./category/category.validator"),
  },
  USERENGAGEMENT: {
    APIS: require("./postEngagement/post-engagement.controller"),
    VALIDATOR: require("./postEngagement/post-engagement.validator"),
  },
  POSTLIKE: {
    APIS: require("./postLike/post-like.controller"),
    VALIDATOR: require("./postLike/post-like.validator"),
  },
  POSTCOMMENT: {
    APIS: require("./postComment/post-comment.controller"),
    VALIDATOR: require("./postComment/post-comment.validator"),
  },
  POSTSAVE: {
    APIS: require("./postSave/post-save.controller"),
    VALIDATOR: require("./postSave/post-save.validator"),
  },
  CONTACT: {
    APIS: require("./contact/contact.controller"),
    VALIDATOR: require("./contact/contact.validator"),
  },
  POSTSHARE: {
    APIS: require("./postShare/post-share.controller"),
    VALIDATOR: require("./postShare/post-share.validator"),
  },
  PAGES: {
    APIS: require("./pages/pages.controller"),
    VALIDATOR: require("./pages/pages.validator"),
  },
  FILEUPLOAD: {
    APIS: require("./fileUpload/file-upload.controller"),
    VALIDATOR: require("./fileUpload/file-upload.validator"),
  },
  STORY: {
    APIS: require("./story/story.controller"),
    VALIDATOR: require("./story/story.validator"),
  },
  NOTIFICATION: {
    APIS: require("./inAppNotification/inApp.notification.controller"),
    VALIDATOR: require("./inAppNotification/inApp.notification.validator")
  }
};
