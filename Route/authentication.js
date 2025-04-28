const express = require("express");
const authenticate = express.Router();
const { protect, authorize } = require("../middleware/auth");
require("dotenv").config();
// 
const authController = require("../controllers/authentication")
// const crypto = require("crypto");

const { upload } = require('../utilities/cloudinary')

// Register Route
authenticate.post("/register", upload.single("image"),authController.creatUser)
authenticate.post("/refresh-token", authController.refreshToken);
authenticate.get(
  "/user/:id",
  protect,
  authorize("admin"), authController.getUserById
)

authenticate.get(
  "/users",
  protect,
  authorize("admin"), authController.getUsers
)

authenticate.get("/profile", protect, authController.getLoggedInUser)

authenticate.post("/login", authController.login)
// console.log(typeof protect, typeof authorize);
authenticate.put("/update-role/:id",
  protect,
  authorize("admin"),authController.updateRole
)

authenticate.post("/logout", authController.logout);

authenticate.delete(
  "/user/:id",
  protect,
  authorize("admin"), authController.deleteUser

);



// 📌 Forget Password Route
authenticate.post("/forgot-password", authController.forgotPassword);
// 📌 Reset Password Route
authenticate.post("/reset-password/:token", authController.resetPassword);
authenticate.put("/update-password", protect, authController.updatePassword);
authenticate.get("/staff", protect, authorize("admin"), authController.getStaff);
authenticate.get(
  "/admin",
  protect,
  authorize("admin"),
  authController.getAdmins
);
authenticate.get(
  "/user-role",
  protect,
  authorize("admin"),
  authController.getOnlyUsers
);
authenticate.get(
  "/admin-staff",
  protect,
  authorize("admin"),
  authController.getAdminsOrStaffS
);
authenticate.put(
  "/update-profile/:id",
  upload.single("image"),
  protect,
  authController.updateUser
);

module.exports = authenticate;
