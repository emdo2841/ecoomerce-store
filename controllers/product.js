
const { uploadToCloudinary } = require('../utilities/cloudinary')
require("dotenv").config();
const mongoose = require("mongoose")
const Product = require("../models/product")
const paginate = require('../utilities/paginate')

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
        const { page, limit, skip } = paginate(req)
        const products = await Product.find( { stock:{ $gt: 0 } }).limit(limit).skip(skip).sort({ createdAt: -1 })// Sort by newest
        .populate("category", "name")
        .populate("brand", "name")
            .exec();
        const totalProducts = await Product.countDocuments({
          stock: { $gt: 0 },
        });
        res.status(200).json({ page, count: products.length, total: totalProducts, data: products, success: true });
    } catch (error) {
        res.status(500).json({ error: "error fetching product", details: error });
    }
}

exports.getflashSaleProducts = async (req, res) => { 
    try {
        const { page, limit, skip } = paginate(req)
        const flashSales = await Product.find({ stock: { $gt: 0 }, discountPercentage: { $gt: 40 } }).limit(limit).skip(skip).sort({ createdAt: -1 })// Sort by newest
        .populate("category", "name")
        .populate("brand", "name")
            .exec();
        res.status(200).json({ page, limit, count: flashSales.length, data: flashSales, success: true });
        
    }catch(error){
        res.status(500).json({ error: "error fetching product", details: error });
    }
}
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
        path: 'reviews.user',
        select: 'fullName', // assuming your User model has fullName
      })
      .populate('category brand');
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
            data: product
        })
    } catch (error) {
        res.status(500).json({ error: "server error" })
    }
}
exports.updateProductById = async (req, res) => {
    try {
        const id = req.params.id;
        const updateProduct = req.body
        if (!updateProduct) {
            return res.status(404).json({
                success: false,
                message: "product not found",

            });
        }
        const getproduct = await Product.findByIdAndUpdate(id, updateProduct, { new: true });
        res.status(200).json({
            success: true,
            message: "product found",
            data: getproduct
        })

    } catch (error) {
        res.status(500).json({ error: "server error" })
    }

}
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
}