const express = require('express');
const brand = express.Router();
const brandController = require("../controllers/brand");
const {protect, authorize} = require("../middleware/auth")


// Create a new brand
brand.post("/", protect, authorize("admin", "staff"), brandController.createBrand);

// Get all brands
brand.get("/", brandController.getAllBrand);

// Get a single brand
brand.get("/:id", brandController.getBrandById);

// Update a brand
brand.put(
  "/:id",
  protect, 
 authorize("admin", "staff"),
  brandController.updateBrand
);  

// Delete a brand
brand.delete(
  "/:id",
  protect, 
 authorize("admin", "staff"),
  brandController.deleteBrand
);

brand.get("/product/:brand", brandController.getProductByBrandId)
// Get all products by brand

module.exports = brand