const express = require("express");
const authenticate = express.Router();
const passport = require("passport");
const isAuthenticated = require('../middleware/isAuthenticated')
const authorizeRole = require('../middleware/authorizeRole');
require("dotenv").config();
// 
const authController = require("../controllers/authentication")
// const crypto = require("crypto");

const { upload } = require('../utilities/cloudinary')

// Register Route
authenticate.post("/register", upload.single("image"),authController.creatUser)

authenticate.get(
  "/user/:id",
  isAuthenticated,
  authorizeRole("admin"), authController.getUserById
)

authenticate.get(
  "/users",
  isAuthenticated,
  authorizeRole("admin"), authController.getUsers
)

authenticate.get("/profile", isAuthenticated, authController.getLoggedInUser)

authenticate.post("/login", passport.authenticate("local"), authController.login)
// console.log(typeof isAuthenticated, typeof authorizeRole);
authenticate.put("/update-role/:id",
  isAuthenticated,
  authorizeRole("admin"),authController.updateRole
)

authenticate.get("/logout", authController.logout);

authenticate.delete(
  "/user/:id",
  isAuthenticated,
  authorizeRole("admin"), authController.deleteUser

);



// 📌 Forget Password Route
authenticate.post("/forgot-password", authController.forgotPassword);
// 📌 Reset Password Route
authenticate.post("/reset-password/:token", authController.resetPassword);
authenticate.put("/update-password", isAuthenticated, authController.updatePassword);
authenticate.get("/staff", isAuthenticated, authorizeRole("admin"), authController.getStaff);
authenticate.get(
  "/admin",
  isAuthenticated,
  authorizeRole("admin"),
  authController.getAdmins
);
authenticate.get(
  "/user-role",
  isAuthenticated,
  authorizeRole("admin"),
  authController.getOnlyUsers
);
authenticate.get(
  "/admin-staff",
  isAuthenticated,
  authorizeRole("admin"),
  authController.getAdminsOrStaffS
);


module.exports = authenticate;
