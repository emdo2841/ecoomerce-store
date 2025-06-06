const Category = require("../models/productCategory");
const Product = require("../models/product");
const mongoose = require("mongoose");
const paginate = require("../utilities/paginate");

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !description) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const newCategory = await Category.create({ name, description });
    res.status(201).json({
      message: "Category created successfully",
      category: newCategory,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getAllCategory = async (req, res) => {
  const { page, limit, skip } = paginate(req);
  try {
    const categories = await Category.find({})
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 }); // Sort by newest
    const totalCategories = await Category.countDocuments();
    res.status(200).json({
      page,
      count: categories.length,
      total: totalCategories,
      data: categories,
      success: true,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// exports.getProductByCategoryId = async (req, res) => {
//   const { limit, skip } = paginate(req);
//   try {
//     const category = req.params.category;

//     // Check if the category is a valid ObjectId
//     if (!mongoose.Types.ObjectId.isValid(category)) {
//       return res.status(400).json({ error: "Invalid category ID" });
//     }

//     // Convert the category to an ObjectId
//     const categoryId = new mongoose.Types.ObjectId(category);

//     // Query the database for products with the specified category
//     const products = await Product.find({ category: categoryId })
//       .limit(limit)
//       .skip(skip)
//       .sort({ createdAt: -1 }) // Sort by newest
//       .populate("category", "name")
//       .populate("brand", "name")
//       .exec();
//     const totalProducts = await Product.countDocuments({
//       stock: { $gt: 0 },
//     });
//     res.status(200).json({
//       page,
//       count: products.length,
//       total: totalProducts,
//       data: products,
//       success: true,
//     });
//   } catch (error) {
//     res.status(500).json({ error: "Server error", details: error.message });
//   }
// };
exports.getProductByCategoryId = async (req, res) => {
  const { limit, skip } = paginate(req);
  try {
    const category = req.params.category;

    // Check if the category is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    // Convert the category to an ObjectId
    const categoryId = new mongoose.Types.ObjectId(category);

    // Query the database for products with the specified category
    const products = await Product.find({ category: categoryId })
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 }) // Sort by newest
      .populate("category", "name")
      .populate("brand", "name")
      .exec();

    // Get the total number of products in this category (not just those with stock > 0)
    const totalProducts = await Product.countDocuments({
      category: categoryId,
    });

    res.status(200).json({
      page: parseInt(req.query.page) || 1,
      count: products.length,
      total: totalProducts,
      data: products,
      success: true,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

exports.deleteProductByCategoryId = async (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  try {
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
