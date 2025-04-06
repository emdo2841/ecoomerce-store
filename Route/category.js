const express = require('express');
const categoryRoute = express.Router();
const categoryController = require('../controllers/category');
const checkRole = require("../middleware/checkRole");
const isAuthenticated = require("../middleware/isAuthenticated");


categoryRoute.post('/', isAuthenticated, checkRole(["admin", "staff"]),categoryController.createCategory); // Create a new category
categoryRoute.get('/', isAuthenticated,
  checkRole(["admin"]), categoryController.getAllCategory); // Get all categories
categoryRoute.get(
  "/:id",
  isAuthenticated,
  checkRole(["admin"]),
  categoryController.getCategoryById
); // Get category by ID
categoryRoute.get('/category/:category', categoryController.getProductByCategoryId); // Update category by ID
categoryRoute.delete(
  "/:id",
  isAuthenticated,
  checkRole(["admin"]),
  categoryController.deleteProductByCategoryId
);

module.exports = categoryRoute;