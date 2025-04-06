const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Brand = mongoose.model("Brand", brandSchema);
module.exports = Brand;
