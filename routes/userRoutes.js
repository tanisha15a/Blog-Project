const express = require("express");
const User = require("../models/User");

const {
  getProfile,
  getEditProfileForm,
  updateUserProfile,
  deleteUserAccount,
} = require("../controllers/userController");
const { ensureAuthenticated } = require("../middlewares/auth");
const upload = require("../config/multer");

const userRoutes = express.Router();

//Get profile
userRoutes.get("/profile", ensureAuthenticated, getProfile);

//Render the edit profile page
userRoutes.get("/edit", ensureAuthenticated, getEditProfileForm);
userRoutes.post("/delete", ensureAuthenticated, deleteUserAccount);
userRoutes.post(
  "/edit",
  ensureAuthenticated,
  upload.single("profilePicture"),
  updateUserProfile
);

module.exports = userRoutes;
