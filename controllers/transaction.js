
const Transaction = require("../models/transaction");
const Product = require("../models/product");
const mongoose = require("mongoose");
require("dotenv").config
const axios = require("axios");
const crypto = require("crypto");
const paginate = require("../utilities/paginate");
const sendEmail = require("../utilities/sendEmail");




// Get all transactions for a specific user
exports.getUserTransaction = async (req, res) => {
  try {
    const { userId } = req.params;

    // Populate only the `products.product` field
    const transactions = await Transaction.find({ user: userId })
      .populate("products.product") // Correctly populate the product field
      .exec();

    if (transactions.length === 0) {
      return res.status(404).json({ message: "No transactions found" });
    }

    res.status(200).json({
      success: true,
      message: "Transactions fetched successfully",
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Create a new transaction and process payment with Paystack
exports.createTransaction = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { user, products, email, address } = req.body; // Include address in the request body

    // Validate input
    if (
      !user ||
      !Array.isArray(products) ||
      products.length === 0 ||
      !email ||
      !address
    ) {
      return res
        .status(400)
        .json({
          error: "User, email, address, and at least one product are required",
        });
    }

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(user)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    let totalPrice = 0;
    let moneySaved = 0;

    await session.withTransaction(async () => {
      // Process products in parallel
      const transactionProducts = await Promise.all(
        products.map(async (item) => {
          const { product, quantity } = item;

          // Validate product ID and quantity
          if (
            !mongoose.Types.ObjectId.isValid(product) ||
            !quantity ||
            quantity < 1
          ) {
            throw new Error("Invalid product ID or quantity");
          }

          // Find the product within the session
          const productToBuy = await Product.findById(product).session(session);
          if (!productToBuy) {
            throw new Error(`Product with ID ${product} not found`);
          }

          // Check stock availability
          if (productToBuy.stock < quantity) {
            throw new Error(`Insufficient stock for ${productToBuy.name}`);
          }

          // Calculate price and savings
          const productTotalPrice = productToBuy.discountedPrice * quantity;
          const productMoneySaved =
            (productToBuy.price - productToBuy.discountedPrice) * quantity;

          // Deduct stock (Update within transaction)
          productToBuy.stock -= quantity;
          await productToBuy.save({ session });

          // Update total price and money saved
          totalPrice += productTotalPrice;
          moneySaved += productMoneySaved;

          // Return transaction product details
          return {
            product: productToBuy._id,
            quantity,
            totalPrice: productTotalPrice,
            moneySaved: productMoneySaved,
          };
        })
      );

      // Generate a unique transaction reference
      const reference = `txn_${crypto.randomBytes(8).toString("hex")}`;

      // Create a new transaction in DB (Pending)
      const transaction = new Transaction({
        user,
        products: transactionProducts,
        totalPrice,
        moneySaved,
        reference,
        address, // Include address in the transaction
        status: "pending", // Payment not completed yet
      });

      // Save transaction within the session
      await transaction.save({ session });

      // Initialize Paystack Payment
      const paystackResponse = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
          email,
          amount: totalPrice * 100, // Convert to kobo
          reference,
          callback_url: `${process.env.PAYSTACK_CALLBACK_URL}/verify-payment/${reference}`,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Send email to the user with transaction details
      const transactionDetails = {
        transactionId: reference,
        amount: totalPrice,
        date: new Date().toLocaleString(),
      };

      await sendEmail(
        email,
        user.firstname || "Customer", // Use user's firstname or a fallback
        null,
        false,
        true, // Not a payment success email
        transactionDetails
      );
      // Respond to client
      res.status(201).json({
        message: "Transaction created successfully, redirect to Paystack",
        transaction,
        paystack: paystackResponse.data,
      });
    });
  } catch (error) {
    console.log(error)
    return res
      .status(500)
      .json({ error: error.message || "Internal server error", error });
  } finally {
    session.endSession(); // Ensure the session is closed properly
  }
};
exports.verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params; // Get reference from route parameters

    if (!reference) {
      return res
        .status(400)
        .json({ error: "Transaction reference is required" });
    }

    // Verify transaction from Paystack
    const paystackResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const paymentData = paystackResponse.data;

    if (paymentData.status && paymentData.data.status === "success") {
      // Find the transaction in DB
      const transaction = await Transaction.findOne({ reference }).populate(
        "user",
        "firstname email"
      );

      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (transaction.status === "completed") {
        return res.status(200).json({
          message: "Transaction already verified",
          transaction,
        });
      }

      // Update transaction status to completed
      transaction.status = "completed";
      await transaction.save();

      // Send payment success email
      const transactionDetails = {
        transactionId: transaction.reference,
        amount: transaction.totalPrice,
        date: transaction.createdAt.toLocaleString(),
      };

      await sendEmail(
        transaction.user.email,
        transaction.user.firstname,
        null,
        false,
        true, // isPaymentSuccess
        transactionDetails
      );

      return res.status(200).json({
        message: "Payment verified successfully",
        transaction,
        redirect: "/payment-success",
      });
    } else {
      return res.status(400).json({ error: "Payment verification failed" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};
exports.getAllTransaction = async (req, res) => {
  const { page, limit, skip } = paginate(req); // Use the paginate utility to get pagination details
  try {
    const transactions = await Transaction.find({})
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .populate("user", "firstname lastname email") // Populate user details
      .populate("products.product", "name discountedPrice") // Populate product details
      .exec();

    res.status(200).json({
      success: true,
      message: "Transactions fetched successfully",
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}