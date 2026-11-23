const express = require("express");
const userController = require("../controllers/userController");

const userRouter = express.Router();

userRouter.get("/allUsers", userController.getAllUsers);

userRouter.post("/signup", userController.signup);
userRouter.post("/login", userController.login);

userRouter.get("/userProfile/:id", userController.getUserProfile);
userRouter.put("/updateProfile/:id", userController.updateUserProfile);
userRouter.delete("/deleteProfile/:id", userController.deleteUserProfile);

// Follow / Unfollow
userRouter.post("/follow/:id", userController.followUser);
userRouter.delete("/unfollow/:id", userController.unfollowUser);

// Followers / Following
userRouter.get("/followStats/:id", userController.getFollowStats);

module.exports = userRouter;
