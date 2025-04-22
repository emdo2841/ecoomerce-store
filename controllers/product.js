const {
  uploadToCloudinary,
  extractCloudinaryPublicId,
  // deleteFromCloudinary,
} = require("../utilities/cloudinary");
require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../models/product");
const paginate = require("../utilities/paginate");
const cloudinary = require("cloudinary").v2;

exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      stock,
      category,
      brand,
      discountedPrice,
    } = req.body;

    // Collect validation errors
    const errors = {};

    if (!name) errors.name = "Product name is required";
    if (!description) errors.description = "Description is required";
    if (!price || isNaN(price)) errors.price = "Valid price is required";
    if (!stock || isNaN(stock)) errors.stock = "Valid stock count is required";
    if (!category || !mongoose.Types.ObjectId.isValid(category)) {
      errors.category =
        "Invalid category ID. It must be a 24-character hex string.";
    }
    if (!brand || !mongoose.Types.ObjectId.isValid(brand)) {
      errors.brand = "Invalid brand ID. It must be a 24-character hex string.";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    // Check for duplicate product name
    const existingProduct = await Product.findOne({ name: name.trim() });
    if (existingProduct) {
      return res.status(409).json({
        error: `A product with the name '${name}' already exists.`,
      });
    }

    // Upload all images to Cloudinary and get URLs
    const imageUrls = await Promise.all(
      req.files.map((file) => uploadToCloudinary(file.path))
    );

    // Create a new product
    const product = new Product({
      name: name.trim(),
      description,
      price,
      stock,
      category: new mongoose.Types.ObjectId(category),
      brand: new mongoose.Types.ObjectId(brand),
      images: imageUrls,
      discountedPrice,
    });

    await product.save();
    res.status(201).json({ message: "Product created successfully", product });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: "Duplicate key error",
        details: error.keyValue,
      });
    }
    res.status(500).json({ message: "Server error", details: error.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req);
    const products = await Product.find({ stock: { $gt: 0 } })
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 }) // Sort by newest
      .populate("category", "name")
      .populate("brand", "name")
      .exec();
    const totalProducts = await Product.countDocuments({
      stock: { $gt: 0 },
    });
    res
      .status(200)
      .json({
        page,
        count: products.length,
        total: totalProducts,
        data: products,
        success: true,
      });
  } catch (error) {
    res.status(500).json({ error: "error fetching product", details: error });
  }
};

exports.getflashSaleProducts = async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req);
    const flashSales = await Product.find({
      stock: { $gt: 0 },
      discountPercentage: { $gt: 40 },
    })
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 }) // Sort by newest
      .populate("category", "name")
      .populate("brand", "name")
      .exec();
    res
      .status(200)
      .json({
        page,
        limit,
        count: flashSales.length,
        data: flashSales,
        success: true,
      });
  } catch (error) {
    res.status(500).json({ error: "error fetching product", details: error });
  }
};
// get out of stock product
exports.getOutOfStockProducts = async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req); // Use pagination utility

    // Find products with stock equal to 0
    const outOfStockProducts = await Product.find({ stock: { $lte: 0 } })
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 }) // Sort by newest
      .populate("category", "name")
      .populate("brand", "name")
      .exec();

    if (outOfStockProducts.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No out-of-stock products found" });
    }

    res.status(200).json({
      success: true,
      message: "Out-of-stock products fetched successfully",
      count: outOfStockProducts.length,
      data: outOfStockProducts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};
exports.getProductsById = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id)
      .populate({
        path: "reviews.user",
        select: "fullName", // assuming your User model has fullName
      })
      .populate("category brand");
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "product not found",
      });
    }
    product.reviews = product.reviews.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    res.status(200).json({
      success: true,
      message: "product fetched successfully",
      data: product,
    });
  } catch (error) {
    res.status(500).json({ error: "server error" });
  }
};
// POST /api/products/:id/reviews
exports.createReview = async (req, res) => {
  const { rating, comment } = req.body;
  const userId = req.user._id; // assuming you're using middleware to set req.user

  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if this user already reviewed
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === userId.toString()
    );

    if (alreadyReviewed) {
      return res
        .status(400)
        .json({ message: "You already reviewed this product" });
    }

    // Add the review
    const newReview = {
      user: userId,
      rating,
      comment,
    };

    product.reviews.push(newReview);
    await product.save();

    res
      .status(201)
      .json({ message: "Review added successfully", review: newReview });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding review", error: error.message });
  }
};
// GET /api/products/:id/reviews
exports.getReview = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "reviews.user",
      "name email"
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product); // ✅ Return the full product
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch product with reviews",
      error: error.message,
    });
  }
};
exports.updateReviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, userId } = req.body;

    if (!userId || !rating) {
      return res.status(400).json({
        success: false,
        message: "User ID and rating are required",
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const reviewIndex = product.reviews.findIndex(
      (rev) => rev.user.toString() === userId
    );

    if (reviewIndex === -1) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this review.",
      });
    }

    // Update the review fields
    product.reviews[reviewIndex].rating = rating;
    product.reviews[reviewIndex].comment = comment || "";

    await product.save(); // triggers your average rating, money saved, etc.

    return res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data: product,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// exports.updateProductById = async (req, res) => {
//   try {
//     const id = req.params.id;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid product ID" });
//     }

//     const existingProduct = await Product.findById(id);
//     if (!existingProduct) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Product not found" });
//     }

//     const updateFields = { ...req.body };

//     // Convert certain fields to numbers/Objects if needed
//     if (updateFields.price) updateFields.price = Number(updateFields.price);
//     if (updateFields.stock) updateFields.stock = Number(updateFields.stock);
//     if (updateFields.discountedPrice)
//       updateFields.discountedPrice = Number(updateFields.discountedPrice);
//     if (
//       updateFields.category &&
//       mongoose.Types.ObjectId.isValid(updateFields.category)
//     ) {
//       updateFields.category = new mongoose.Types.ObjectId(
//         updateFields.category
//       );
//     }
//     if (
//       updateFields.brand &&
//       mongoose.Types.ObjectId.isValid(updateFields.brand)
//     ) {
//       updateFields.brand = new mongoose.Types.ObjectId(updateFields.brand);
//     }

//     // Handle images
//     let updatedImages = existingProduct.images || [];

//     // Remove images if requested
//     if (req.body.imagesToRemove) {
//       const toRemove = Array.isArray(req.body.imagesToRemove)
//         ? req.body.imagesToRemove
//         : [req.body.imagesToRemove];

//       updatedImages = updatedImages.filter((img) => !toRemove.includes(img));

//       // OPTIONAL: You can also delete from Cloudinary if desired
//       for (const imgUrl of toRemove) {
//         const publicId = extractCloudinaryPublicId(imgUrl); // write a helper for this
//         await cloudinary.uploader.destroy(publicId);
//       }
//     }

//     // Append new images if uploaded
//     if (req.files && req.files.length > 0) {
//       const newImageUrls = await Promise.all(
//         req.files.map((file) => uploadToCloudinary(file.path))
//       );
//       updatedImages = updatedImages.concat(newImageUrls);
//     }

//     updateFields.images = updatedImages;

//     const updatedProduct = await Product.findByIdAndUpdate(id, updateFields, {
//       new: true,
//       runValidators: true,
//     });

//     res.status(200).json({
//       success: true,
//       message: "Product updated successfully",
//       data: updatedProduct,
//     });
//   } catch (error) {
//     console.error("Update error:", error);
//     res
//       .status(500)
//       .json({
//         success: false,
//         message: "Server error",
//         details: error.message,
//       });
//   }
// };
// Helper function to check if a value is a valid ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

exports.updateProductById = async (req, res) => {
  try {
    const id = req.params.id;

    if (!isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID" });
    }

    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const updateFields = { ...req.body };

    // Type conversion with more checks
    if (updateFields.price !== undefined) {
      const price = Number(updateFields.price);
      if (isNaN(price)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid price format" });
      }
      updateFields.price = price;
    }
    if (updateFields.stock !== undefined) {
      const stock = Number(updateFields.stock);
      if (isNaN(stock)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid stock format" });
      }
      updateFields.stock = stock;
    }
    if (updateFields.discountedPrice !== undefined) {
      const discountedPrice = Number(updateFields.discountedPrice);
      if (isNaN(discountedPrice)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid discountedPrice format" });
      }
      updateFields.discountedPrice = discountedPrice;
    }
    if (updateFields.category !== undefined) {
      if (!isValidObjectId(updateFields.category)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid category ID" });
      }
      updateFields.category = new mongoose.Types.ObjectId(
        updateFields.category
      );
    }
    if (updateFields.brand !== undefined) {
      if (!isValidObjectId(updateFields.brand)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid brand ID" });
      }
      updateFields.brand = new mongoose.Types.ObjectId(updateFields.brand);
    }

    let updatedImages = existingProduct.images || [];


    // Handle image removal
    if (req.body.imagesToRemove) {
      const toRemove = Array.isArray(req.body.imagesToRemove)
        ? req.body.imagesToRemove
        : [req.body.imagesToRemove];

      const imagesToRemoveErrors = [];
      const finalImages = [];

      for (const img of updatedImages) {
        if (toRemove.includes(img)) {
          try {
            const publicId = extractCloudinaryPublicId(img);
            if (publicId) {
              await cloudinary.uploader.destroy(publicId);
            }
          } catch (error) {
            console.error("Cloudinary delete error:", error);
            imagesToRemoveErrors.push({ url: img, error: error.message });
          }
        } else {
          finalImages.push(img);
        }
      }

      updatedImages = finalImages;
      if (imagesToRemoveErrors.length > 0) {
        console.warn("Errors deleting some images:", imagesToRemoveErrors);
        // You might want to inform the user about these errors in the response
      }
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      try {
        const newImageUrls = await Promise.all(
          req.files.map((file) => uploadToCloudinary(file.path))
        );
        updatedImages = updatedImages.concat(newImageUrls);
        updateFields.images = updatedImages.filter(Boolean); // remove null/undefined
      } catch (error) {
        console.error("Cloudinary upload error:", error);
        return res.status(500).json({
          success: false,
          message: "Error uploading new images",
          details: error.message,
        });
      }
    }

    updateFields.images = updatedImages;

    const updatedProduct = await Product.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      details: error.message,
    });
  }
};
exports.deleteProduct = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ message: "Missing ID parameter" });
    }

    const removeProduct = await Product.findByIdAndDelete(id);
    if (!removeProduct) {
      return res.status(404).json({ message: "product not found" });
    }
    res.status(200).json({
      successful: true,
      message: "product deleted successfully",
      redirect: "/ecommerce",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
