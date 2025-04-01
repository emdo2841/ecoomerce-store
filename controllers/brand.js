const Brand = require("../models/brand");
const Product = require("../models/product");
const mongoose = require("mongoose");
const paginate = require("../utilities/paginate");

exports.createBrand = async (req, res) => {
  try {
    const brand = await Brand.create(req.body);

    res.status(201).send(brand);
  } catch (error) {
    res.status(400).send(error);
  }
};
exports.getAllBrand = async (req, res) => {
    try {
        const { page, limit } = paginate(req)
        const brands = await Brand.find().limit(limit).skip(page).sort({ createdAt: -1 })// Sort by newest;
        res.status(200).json({
            success: true,
            message: "Brands fetched successfully",
            data: brands,
        })
        
    } catch (error) {
        res.status(500).send(error);
    }
}

exports.getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).send("Brand not found");
    }
    res.send(brand);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.updateBrand = async (req, res) => {
    try {
        const brand = await Brand.findByIdAndUpdate(req.params
            .id, req.body, { new: true });
        if (!brand) {
            return res.status(404).send("Brand not found");
        }
        res.status(200).send(brand);
    } catch (error) {
        res.status(400
        ).
        send(error);
    }
}

exports.deleteBrand = async (req, res) => {
    try {
        const brand = await Brand.findByIdAndDelete(req.params.id);
        if (!brand) {
            return res.status(404).send("Brand not found");
        }
        res.send(brand);
    } catch (error) {
        res.status(500).send(error);
    }
}

exports.getProductByBrandId = async (req, res) => {
    try {
        const brand = req.params.brand;

        // Check if the brand is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(brand)) {
            return res.status(400).json({ error: "Invalid brand ID" });
        }
        const { limit, page } = paginate(req)
        // Convert the brand to an ObjectId
        const brandId = new mongoose.Types.ObjectId(brand);

        // Query the database for products with the specified brand
        const products = await Product.find({ brand: brandId })
          .limit(limit)
          .skip(page)
          .sort({ createdAt: -1 }) // Sort by newest
          .populate("category", "name")
          .populate("brand", "name")
          .exec();;


        res.status(200).json({
            success: true,
            message: "Products fetched successfully",
            data: products,
        });
    } catch (error) {
        res.status(500).json({ error: "Server error", details: error.message });
    }
};