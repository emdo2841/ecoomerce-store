const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    moneySaved:{
      type:String,
      require:true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    images: [{ type: String, required: true }],
    color: { type: String },
    size: { type: String},
    reviews: [reviewSchema],
    averageRating: { type: Number, default: 0 },
    discountedPrice: { type: Number, required: true },
    discountPercentage: { type: Number, min: 0, max: 100, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Middleware to calculate average rating
productSchema.pre("save", function (next) {
  if(this.discountedPrice <= this.price){
    this.moneySaved = this.price - this.discountedPrice;
  }else{
    this.moneySaved = 0;
  }
  next()
});
productSchema.pre("save", function (next) {
  if (this.reviews.length > 0) {
    this.averageRating =
      this.reviews.reduce((acc, review) => acc + review.rating, 0) /
      this.reviews.length;
  } else {
    this.averageRating = 0;
  }
  next();
});

// Middleware to calculate discount percentage and enforce rules before saving
productSchema.pre("save", function (next) {
  // Ensure discountedPrice is never greater than the original price
  if (this.discountedPrice > this.price) {
    return next(
      new Error("Discounted price cannot be greater than the original price.")
    );
  }

  // Ensure discountPercentage is correctly calculated and within bounds
  if (this.price > 0 && this.discountedPrice >= 0) {
    this.discountPercentage =
      (this.moneySaved / this.price) * 100;

    // Ensure discount percentage does not exceed 100%
    if (this.discountPercentage > 100) {
      return next(new Error("Discount percentage cannot exceed 100%."));
    }
  }

  next();
});
productSchema.pre("save", function (next) {
  if (this.reviews.length > 0) {
    this.averageRating =
      this.reviews.reduce((acc, review) => acc + review.rating, 0) /
      this.reviews.length;
  } else {
    this.averageRating = 0;
  }
  next();
});
const Product = mongoose.model("Product", productSchema);
module.exports = Product;
// The product model is more complex than the category model. It includes a reference to the Category model, an array of reviews, and fields for calculating average rating and discount percentage. The product model also includes two middleware functions to calculate the average rating and enforce rules for discount percentage before saving the document.