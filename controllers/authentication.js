
const User = require("../models/user");
const { uploadToCloudinary } = require('../utilities/cloudinary')
require("dotenv").config();
const sendEmail = require("../utilities/sendEmail");
const crypto = require("crypto");
const paginate = require('../utilities/paginate')
const jwt = require("jsonwebtoken");
const { generateToken, generateRefreshToken } = require("../utilities/jwt");
const TokenStore = require("../models/tokenStore"); // A model to store refresh tokens (explained below)


exports.creatUser = async (req, res) => {
    try {
      // const imageUrls = await Promise.all(req.files.map(file => uploadToCloudinary(file.path)));
      const imageUrl = req.file
        ? await uploadToCloudinary(req.file.path)
        : null;
      const { fullName, email, password, address, phone } =
        req.body;

      if (
        !fullName ||
        !email ||
        !password ||
        !address ||
        !phone
      ) {
        return res
          .status(400)
          .json({ success: false, message: "Please fill all fields" });
      }
      // Email regex for validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      // Validate email format
      if (!emailRegex.test(email)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid email format" });
      }
      
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/; // At least 8 characters, including letters and numbers
      // Validate password format
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 8 characters long and include both letters and numbers",
        });
      }
      // Check if the email already exists
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res
          .status(409)
          .json({
            success: false,
            message: "Email already exists",
          });
      }

      const existingPhone = await User.findOne({ phone });

      if (existingPhone) {
        return res.status(409).json({
          success: false,
          message: "phone Number already exists",
        });
      }


      // Create a new User
      const newUser =  await User.create({
        email,
        fullName,
        role: "user",
        image: imageUrl,
        address,
        phone,
        password
      });
      const token = generateToken(newUser); // Generate JWT token
      
      res.status(201).json({
        success: true,
        message: "User created successfully and file uploaded successfully!",
        redirect: "/auth/login",
        data: { id: newUser._id, fullName, phone, address, token,email, role: newUser.role },
      });
      sendEmail(email, fullName); // Send welcome email
    } catch (err) { 
        console.log(err)
        res.status(500).send({ success: false, message: "Server error", err });
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
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const {limit, skip} = paginate(req)
        const users = await User.find({ _id: { $ne: req.user._id } })
        .limit(limit).skip(skip ).sort({ createdAt: -1 })// Sort by newest// 🔥 Exclude logged-in user
            .select("-password"); // Exclude passwords for security

        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};
exports.getLoggedInUser = (req, res) => {
    

  if (!req.user) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized. Please log in." });
  }

  // Exclude sensitive fields like password
  const { _id, fullName, email, role, address, phone, image } = req.user;

  res.status(200).json({
    success: true,
    user: { _id, fullName, email, role, address, phone, image },
   
  });
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token in the database
    await TokenStore.create({ token: refreshToken, user: user._id });

    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.fullName,
        phone: user.phone,
        email: user.email,
        role: user.role,
        image: user.image
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// return admins only
exports.getAdmins = async (req, res) => {
  try {
    const { limit, skip } = paginate(req);

    const users = await User.find({ role: "admin" })
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 })
      .select("-password");

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// return staff only
exports.getStaff = async (req, res) => {
  try {
    const { limit, skip } = paginate(req);

    // Find users with the role "admin"
    const staffs = await User.find({ role: "staff" })
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 }) // Sort by newest
      .select("-password"); // Exclude passwords for security

    res.json({ success: true, staffs });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
 
// return users only
exports.getOnlyUsers = async (req, res) => {
  try {
    const { limit, skip } = paginate(req);

    const users = await User.find({ role: "user" })
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 })
      .select("-password");

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// return admins or staff only
exports.getAdminsOrStaffS = async (req, res) => {
  try {
    const { limit, page } = paginate(req);

    // Find users with roles "admin" or "staff"
    const users = await User.find({ role: { $in: ["admin", "staff"] } })
      .limit(limit)
      .skip(page)
      .sort({ createdAt: -1 }) // Sort by newest
      .select("-password"); // Exclude passwords for security


    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
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
        res.status(500).json({ success: false, message: "Server error" });
    }
};



exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res
        .status(400)
        .json({ success: false, message: "Refresh token is required" });
    }

    // ✅ Use JWT_REFRESH_SECRET to verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Remove the refresh token from the database or in-memory store
    await TokenStore.findOneAndDelete({ token: refreshToken });

    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
        message: "Logout failed",
      error: error.message,
    });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Check if the refresh token exists in the database
    const storedToken = await TokenStore.findOne({ token: refreshToken });
    if (!storedToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Generate a new access token
    const user = await User.findById(decoded.id);
    const newAccessToken = generateToken(user);

    // Generate a new refresh token
    const newRefreshToken = generateRefreshToken(user);

    // Save the new refresh token and delete the old one
    await TokenStore.create({ token: newRefreshToken, user: user._id });
    await TokenStore.findOneAndDelete({ token: refreshToken });

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};
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

exports.updateUser = async (req, res) => {
  try {
    const imageUrl = req.file ? await uploadToCloudinary(req.file.path) : null;
    const { fullName, address, phone } = req.body
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { fullName, address, phone, imageUrl },
      { new: true }
    );
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User updated successfully" });
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
        const hashedToken = crypto
          .createHash("sha256")
          .update(token)
          .digest("hex");

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await user.save({ validateModifiedOnly: true });

        // Reset password email
        const resetLink = `https://ecoomerce-store-t40x.onrender.com/api/auth/reset-password/${token}`;

        await sendEmail(user.email, user.firstname, resetLink);

        res.json({
          message:
            "If an account with that email exists, a reset link has been sent.!",
        });

    } catch (error) {
       console.error("Forgot Password Error:", error);
       res
         .status(500)
         .json({ error: "Something went wrong. Please try again later." });
    }
}
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        const hashedToken = crypto
          .createHash("sha256")
          .update(req.params.token)
          .digest("hex");
        // 1️⃣ Find user with the given reset token
      const user = await User.findOne({
            resetPasswordToken: hashedToken ,
            resetPasswordExpires: { $gt: Date.now() }, // Check if token is still valid
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        // 2️⃣ Update the user's password
        user.setPassword(password, async function (err) {
            if (err) {
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
        res.status(500).json({ message: "Server error", error });
    }
}
