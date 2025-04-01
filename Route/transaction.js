const express = require("express")
const transactionRoute = express.Router();
const transactionController = require("../controllers/transaction");
const checkRole = require('../middleware/checkRole')
const isAuthenticated = require('../middleware/isAuthenticated')

transactionRoute.post("/", transactionController.createTransaction); // Create a new transaction
transactionRoute.get("/:userId", transactionController.getUserTransaction); // Get all transactions
transactionRoute.get("/verify/:reference", transactionController.verifyPayment)
transactionRoute.get("/", transactionController.getAllTransaction); // Get all transactions

module.exports = transactionRoute;