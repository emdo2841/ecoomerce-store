const express = require("express")
const transactionRoute = express.Router();
const transactionController = require("../controllers/transaction");
// const auth  = require("../middleware/auth")
// const checkRole = require('../middleware/checkRole')
const {protect} = require("../middleware/auth");

transactionRoute.post("/", transactionController.createTransaction); // Create a new transaction
transactionRoute.get("/:userId", transactionController.getUserTransaction); // Get all transactions
transactionRoute.get("/verify-payment/:reference", transactionController.verifyPayment)
transactionRoute.get("/", transactionController.getAllTransaction); // Get all transactions
transactionRoute.get("/my-transactions", protect, transactionController.getLoggedInUserTransactions)

module.exports = transactionRoute;