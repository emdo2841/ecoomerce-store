const Category = require("../models/productCategory");
const Product = require("../models/product")
const mongoose = require("mongoose");
const paginate = require("../utilities/paginate")

exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body
        if (!name || !description) {
            return res.status(400).json({ message: "Missing required fields" });

        }
        const newCategory = await Category.create({ name, description });
        res.status(201).json({ message: "Category created successfully", category: newCategory });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message });
    }
}
exports.getAllCategory = async (req, res) => {
    const { page, limit } = paginate(req)
    try {
        const categories = await Category.find({}).limit(limit).skip(page).sort({ createdAt: -1 })// Sort by newest
        if (categories.length === 0) {
            return res.status(404).json({ message: "No categories found" });
        }
        res.status(200).json(categories)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message });
    }
}

exports.getCategoryById = async (req,res) =>{
    try {
    const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        res.status(200).json(category)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message });
    }
}
exports.getProductByCategoryId = async (req, res) => {
    const { page, limit } = paginate(req);
    try {
        const category = req.params.category;

        // Check if the category is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(category)) {
        
            return res.status(400).json({ error: "Invalid category ID" });
        }

        // Convert the category to an ObjectId
        const categoryId = new mongoose.Types.ObjectId(category);


        // Query the database for products with the specified category
        const products = await Product.find({ category: categoryId }).limit(limit).skip(page).sort({ createdAt: -1 })// Sort by newest
            .populate("category", "name")
        .populate("brand", "name")
            .exec();

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No products found for the specified category",
            });
        }

        res.status(200).json({
            success: true,
            message: "Products fetched successfully",
            data: products,
        });
    } catch (error) {
        console.log("❌ Error fetching products by category:", error);
        res.status(500).json({ error: "Server error", details: error.message });
    }
};
exports.deleteProductByCategoryId = async (req, res) => { 
    const id = req.params.id
    if(!id){
        return res.status(400).json({ message: "Missing required fields" });
    }
    try {
        const category = await Category.findByIdAndDelete(id);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
    }catch(error){
        console.log(error)
        res.status(500).json({ message: error.message });
    }
}