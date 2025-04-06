const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose")
// const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    firstname: {
      type: String,
      required: true,
    },
    lastname: {
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
    dob: {
      type: Date,
    },
      
    role: {
      type: String,
      enum: ["admin", "staff", "user"],
      default: "user",
    },
    image:{type:String},
    resetPasswordToken: { type: String }, // Stores reset token
    resetPasswordExpires: { type: Date }, // Expiry time for reset token
  },
  { timestamps: true }
);
// by default without typing line 30 it takes username but this code uses line 30 by making email necessary rather than username
userSchema.plugin(passportLocalMongoose,{
    usernameField:"email",
    errorMessage:{
        missingPasswordError:"No password input",
        AttemptTooSoonError:"Account is currently locked.Try again later",
        TooManyAttemptError:"Account locked due to too many failed login attempgt",
        IncorrectPasswordError:"Password or username sre incorrect",
        IncorrectUsernameError:"password or username is incorrect",
        MissingUsernameError:"No Username was given",
        UserExistsError:"A user with the given username is already register",
    },
})
const User = mongoose.model("User",userSchema);
module.exports= User