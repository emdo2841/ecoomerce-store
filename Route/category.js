const express = require('express');
const categoryRoute = express.Router();
const categoryController = require('../controllers/category');
const{ protect, authorize } = require("../middleware/auth");

categoryRoute.post('/', protect, authorize("admin", "staff"),categoryController.createCategory); // Create a new category
categoryRoute.get('/', protect,
  authorize("admin"), categoryController.getAllCategory); // Get all categories
categoryRoute.get(
  "/:id",
  protect,
  authorize(["admin"]),
  categoryController.getCategoryById
); // Get category by ID
categoryRoute.get('/category/:category', categoryController.getProductByCategoryId); // Update category by ID
categoryRoute.delete(
  "/:id",
  protect,
  authorize("admin"),
  categoryController.deleteProductByCategoryId
);

module.exports = categoryRoute;