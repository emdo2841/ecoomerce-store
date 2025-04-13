const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
// const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
   
    email: {
      type: String,
      required: true,
      unique: true,
    },
    address: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
  
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "staff", "user"],
      default: "user",
    },
    image: { type: String },
    resetPasswordToken: { type: String }, // Stores reset token
    resetPasswordExpires: { type: Date }, // Expiry time for reset token
  },
  { timestamps: true }
);
// by default without typing line 30 it takes username but this code uses line 30 by making email necessary rather than username

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User",userSchema);
module.exports= User