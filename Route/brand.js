const express = require('express');
const brand = express.Router();
const brandController = require("../controllers/brand");



// Create a new brand
brand.post("/", brandController.createBrand);

// Get all brands
brand.get("/", brandController.getAllBrand);

// Get a single brand
brand.get("/:id", brandController.getBrandById);

// Update a brand
brand.put("/:id", brandController.updateBrand
);  

// Delete a brand
brand.delete("/:id", brandController.deleteBrand);

brand.get("/brand/:brand", brandController.getProductByBrandId)
// Get all products by brand

module.exports = brand