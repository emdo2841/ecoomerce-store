const express = require('express');
const brand = express.Router();
const brandController = require("../controllers/brand");
const checkRole = require("../middleware/checkRole");
const isAuthenticated = require("../middleware/isAuthenticated");



// Create a new brand
brand.post("/", isAuthenticated, checkRole(["admin", "staff"]), brandController.createBrand);

// Get all brands
brand.get("/", brandController.getAllBrand);

// Get a single brand
brand.get("/:id", brandController.getBrandById);

// Update a brand
brand.put(
  "/:id",
  isAuthenticated,
  checkRole(["admin", "staff"]),
  brandController.updateBrand
);  

// Delete a brand
brand.delete(
  "/:id",
  isAuthenticated,
  checkRole(["admin", "staff"]),
  brandController.deleteBrand
);

brand.get("/brand/:brand", brandController.getProductByBrandId)
// Get all products by brand

module.exports = brand