const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Post = require("../models/Post");
const File = require("../models/File");
const cloudinary = require("cloudinary");
const Comment = require("../models/Comment");

//Get user profile
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-password")
    .populate("posts")
    .populate("comments");
  // check if user exists
  if (!user) {
    return res.render("profile", {
      title: "Profile",
      user: req.user,
      error: "User not found",
    });
  }

  //fetch user's posts
  const posts = await Post.find({ author: req.user._id }).sort({
    createdAt: -1,
  });

  res.render("profile", {
    title: "Profile",
    user: user,
    posts,
    postCount: posts.length,
  });
});
//get edit profile form
exports.getEditProfileForm = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  if (!user) {
    return res.render("login", {
      title: "Login",
      user: req.user,
      error: "User not found",
      success: "",
    });
  }
  res.render("editProfile", {
    title: "Edit Profile",
    user,
    error: "",
    success: "",
  });
});

// Update profile
exports.updateUserProfile = asyncHandler(async (req, res) => {
  const { username, email, bio } = req.body;
  const user = await User.findById(req.user._id).select("-password");

  if (!user) {
    return res.render("login", {
      title: "Login",
      user: req.user,
      error: "User not found",
    });
  }

  user.username = username || user.username;
  user.email = email || user.email;
  user.bio = bio || user.bio; // Corrected this line

  // Handle file upload
  if (req.file) {
    if (user.profilePicture && user.profilePicture.public_id) {
      await CloudinaryStorage.uploader.destroy(user.profilePicture.public_id);
    }

    const file = new File({
      url: req.file.path,
      public_id: req.file.filename,
      uploaded_by: req.user._id,
    });

    await file.save();
    user.profilePicture = {
      url: file.url,
      public_id: file.public_id,
    };
  }

  await user.save();
  res.render("editProfile", {
    title: "Edit Profile",
    user,
    error: "",
    success: "Profile updated successfully",
  });
});

//Delete User account
exports.deleteUserAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.render("login", {
      title: "Login",
      user: req.user,
      error: "User not found",
    });
  }

  //Delete user's profile picture from cloudinary
  if (user.profilePicture && user.profilePicture.public_id) {
    await cloudinary.uploader.destroy(user.profilePicture.public_id);
  }
  //Delete all posts created by the user and their associated images and comments
  const posts = await Post.find({ author: req.user._id });
  for (const post of posts) {
    for (const image of post.images) {
      await cloudinary.uploader.destroy(image.public_id);
    }
    await Comment.deleteMany({ post: post._id });
    await Post.findByIdAndDelete(post._id);
  }

  //Delete all the comments made bt the user
  await Comment.deleteMany({ author: req.user._id });

  //Delete all the files uploaded by the user
  const files = await File.find({ uploaded_by: req.user._id });
  for (const file of files) {
    await cloudinary.uploader.destroy(file.public_id);
  }

  //Delete user
  await User.findByIdAndDelete(req.user._id);
  res.redirect("/auth/register");
});
