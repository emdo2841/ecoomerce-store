const mongoose = require("mongoose");


const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
        totalPrice: { type: Number, required: true },
        moneySaved: { type: Number, required: true },
      },
    ],
    totalPrice: { type: Number, required: true },
    moneySaved: { type: Number, required: true }, // Fix: Change reference to number
    // ✅ Add reference field to store Paystack transaction reference
    reference: { type: String, required: true, unique: true },
    address: { type: String, required: true },  
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Transaction = mongoose.model("Transaction", transactionSchema);
module.exports = Transaction;

