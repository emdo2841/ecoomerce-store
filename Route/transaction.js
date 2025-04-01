const express = require("express")
const transactionRoute = express.Router();
const transactionController = require("../controllers/transaction");
const checkRole = require('../middleware/checkRole')


transactionRoute.post("/", transactionController.createTransaction); // Create a new transaction
transactionRoute.get("/:userId", transactionController.getUserTransaction); // Get all transactions
transactionRoute.get("/verify-payment/:reference", transactionController.verifyPayment)
transactionRoute.get("/", checkRole(['admin', 'staff']), transactionController.getAllTransaction); // Get all transactions

module.exports = transactionRoute;