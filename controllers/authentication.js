
const User = require("../models/user");
const { uploadToCloudinary } = require('../utilities/cloudinary')
require("dotenv").config();
const sendEmail = require("../utilities/sendEmail");
const crypto = require("crypto");

exports.creatUser = async (req, res) => {
    try {

        // const imageUrls = await Promise.all(req.files.map(file => uploadToCloudinary(file.path)));
        const imageUrl = req.file ? await uploadToCloudinary(req.file.path) : null;
        const { firstname, lastname, email, dob, role, password } = req.body;


        // Check if the email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res
                .status(409)
                .json({ success: false, message: "Email already exists" });
        }

        // Create a new User
        const newUser = new User({
            email,
            firstname,
            lastname,
            dob: dob || null, // Optional DOB
            role: role || "user",
            image: imageUrl

        });

        // Register user with hashed password
        await User.register(newUser, password);

        res.status(201).json({
            success: true,
            message: "User created successfully and file uploaded successfully!",
            redirect: "/auth/login",
            data: newUser,
        });
        sendEmail(email, firstname);
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, message: "Server error" });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password"); // Exclude password for security

        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        }

        res.json({ success: true, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.user._id } }) // 🔥 Exclude logged-in user
            .select("-password"); // Exclude passwords for security

        res.json({ success: true, users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.login = (req, res) => {         
    res.json({ success: true, message: "Logged in successfully", user: req.user, redirect: "/" });
};

exports.updateRole = async (req, res) => {
    try {
        const { role } = req.body;
        if (!role || !["admin", "staff", "user"].includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid role" });
        }

        const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({ success: true, message: "User role updated", redirect: "/users" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
exports.checkStatus = (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ isAuthenticated: true, user: req.user });
    } else {
        res.json({ isAuthenticated: false });
    }
}

exports.logout = (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Logout failed" });
        }
        res.status(200).json({ success: true, message: "Logged out successfully!", redirect: "/" });
    });
}

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
}

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate reset token
        const token = crypto.randomBytes(20).toString("hex");

        // Set token and expiration
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await user.save({ validateModifiedOnly: true });

        // Reset password email
        const resetLink = `http://localhost:7000/api/auth/reset-password/${token}`;

        await sendEmail(user.email, user.firstname, resetLink);

        res.json({ message: "Password reset email sent!" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
}
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        // 1️⃣ Find user with the given reset token
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }, // Check if token is still valid
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        // 2️⃣ Update the user's password
        user.setPassword(password, async function (err) {
            if (err) {
                console.error("Error in setPassword:", err);
                return res.status(500).json({ message: "Error updating password" });
            }

            // 3️⃣ Clear reset token fields
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save({validateModifiedOnly: true});
            // Send password change confirmation email
            await sendEmail(user.email, user.firstname, null, true);
            res.json({ message: "Password has been reset successfully" });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
    }
}

exports.updatePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = req.user; // Get the logged-in user

        if (!user) {
            return res.status(401).json({ message: "Unauthorized. Please log in." });
        }

        // Authenticate the user using the old password
        user.authenticate(oldPassword, async (err, authenticatedUser) => {
            if (err || !authenticatedUser) {
                return res.status(400).json({ message: "Incorrect old password" });
            }

            // Set the new password
            user.setPassword(newPassword, async (err) => {
              if (err) {
                console.error("Error in setPassword:", err);
                return res
                  .status(500)
                  .json({ message: "Error updating password" });
              }
              // Clear reset token fields
              user.resetPasswordToken = undefined;
              user.resetPasswordExpires = undefined;
              await user.save({validateModifiedOnly: true});

              // Send email notification for password change
              await sendEmail(user.email, user.firstname, null, true);

              res.json({ message: "Password updated successfully" });
            });
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server error", error });
    }
}
