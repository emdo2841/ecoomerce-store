
const { uploadToCloudinary } = require('../utilities/cloudinary')
require("dotenv").config();
const mongoose = require("mongoose")
const Product = require("../models/product")
const paginate = require('../utilities/paginate')

exports.createProduct= async (req, res) => {
    try {
        const categoryId = req.body.category;

        // Validate category ID before using it
        if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({ error: "Invalid category ID. It must be a 24-character hex string." });
        }
        // Upload all images to Cloudinary and get URLs
        const imageUrls = await Promise.all(req.files.map(file => uploadToCloudinary(file.path)));

        // Create a new product
        const product = new Product({
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            stock: req.body.stock,
            category: new mongoose.Types.ObjectId(categoryId),
            brand: req.body.brand,
            images: imageUrls, // Store Cloudinary URLs
            discountedPrice: req.body.discountedPrice
        });

        await product.save();
        res.status(201).json({ message: 'Product created successfully', product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
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
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "product not found",
            });

        }
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