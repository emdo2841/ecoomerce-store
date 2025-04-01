const express = require('express');
const categoryRoute = express.Router();
const categoryController = require('../controllers/category');

categoryRoute.post('/', categoryController.createCategory); // Create a new category
categoryRoute.get('/', categoryController.getAllCategory); // Get all categories
categoryRoute.get('/:id', categoryController.getCategoryById); // Get category by ID
categoryRoute.get('/category/:category', categoryController.getProductByCategoryId); // Update category by ID
categoryRoute.delete("/:id", categoryController.deleteProductByCategoryId)

module.exports = categoryRoute;