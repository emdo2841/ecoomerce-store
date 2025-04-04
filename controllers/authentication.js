const passport = require("passport");
const User = require("../models/user");
const { uploadToCloudinary } = require('../utilities/cloudinary')
require("dotenv").config();
const sendEmail = require("../utilities/sendEmail");
const crypto = require("crypto");
const paginate = require('../utilities/paginate')

exports.creatUser = async (req, res) => {
    try {

        // const imageUrls = await Promise.all(req.files.map(file => uploadToCloudinary(file.path)));
        const imageUrl = req.file ? await uploadToCloudinary(req.file.path) : null;
        const { firstname, lastname, email, dob, password, address, phone } = req.body;

        if (!firstname || !lastname || !email || !password || !address || !phone) {
            return res.status(400).json({ success: false, message: "Please fill all fields" });
        }
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
            role: "user",
            image: imageUrl,
            address,
            phone

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
        const {limit, page} = paginate(req)
        const users = await User.find({ _id: { $ne: req.user._id } })
        .limit(limit).skip(page).sort({ createdAt: -1 })// Sort by newest// 🔥 Exclude logged-in user
            .select("-password"); // Exclude passwords for security

        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};
exports.getLoggedInUser = (req, res) => {
    // if (req.session) {
    //   console.log("✅ Session exists:", req.session);
    // } else {
    //   console.log("❌ No session found");
    // }
    // console.log("🔍 Session:", req.session);
    // console.log("🔍 User:", req.user); 

  if (!req.user) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized. Please log in." });
  }

  // Exclude sensitive fields like password
  const { _id, firstname, lastname, email, role, address, phone, image } = req.user;

  res.status(200).json({
    success: true,
    user: { _id, firstname, lastname, email, role, address, phone, image },
   
  });
};

exports.login = (req, res, next) => {
  const { rememberMe } = req.body;

  passport.authenticate('local', (err, user, info) => {
    if (err || !user) {
      return res.status(401).json({ success: false, message: info?.message || 'Invalid credentials' });
    }

    req.logIn(user, (err) => {
      if (err) return res.status(500).json({ success: false, message: 'Login error' });

      // 👇 Set session duration based on rememberMe
      if (rememberMe) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      } else {
        req.session.cookie.expires = false; // Session cookie (expires when browser closes)
      }

      return res.status(200).json({
        success: true,
        message: "Login successful",
        user: {
          email: user.email,
          name: `${user.firstname} ${user.lastname}`
        }
      });
    });
  })(req, res, next);
};
// return admins only
exports.getAdmins = async (req, res) => {
  try {
    const { limit, page } = paginate(req);

    // Find users with the role "admin"
    const users = await User.find({ role: "admin" })
      .limit(limit)
      .skip(page)
      .sort({ createdAt: -1 }) // Sort by newest
      .select("-password"); // Exclude passwords for security
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// return staff only
exports.getStaff = async (req, res) => {
  try {
    const { limit, page } = paginate(req);

    // Find users with the role "admin"
    const users = await User.find({ role: "staff" })
      .limit(limit)
      .skip(page)
      .sort({ createdAt: -1 }) // Sort by newest
      .select("-password"); // Exclude passwords for security

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
 
// return users only

exports.getOnlyUsers = async (req, res) => {
  try {
    const { limit, page } = paginate(req);

    // Find users with the role "admin"
    const users = await User.find({ role: "user" })
      .limit(limit)
      .skip(page)
      .sort({ createdAt: -1 }) // Sort by newest
      .select("-password"); // Exclude passwords for security

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


exports.logout = (req, res) => {
  req.logout(function(err) {
    if (err) {
      return res.status(500).json({ success: false, message: "Logout failed" });
    }

    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Failed to destroy session" });
      }
      res.clearCookie("connect.sid"); // Important: remove session cookie
      return res.status(200).json({ success: true, message: "Logged out successfully" });
    });
  });
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
        const resetLink = `https://ecoomerce-store-t40x.onrender.com/api/auth/reset-password/${token}`;

        await sendEmail(user.email, user.firstname, resetLink);

        res.json({ message: "Password reset email sent!" });

    } catch (error) {
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
