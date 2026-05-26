import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  paymentGatewayId: { type: String, required: true, unique: true },
  paymentOrderId: { type: String, required: true },
  gateway: { type: String, default: "razorpay" },
  status: {
    type: String,
    enum: ["pending", "succeeded", "failed", "refunded"],
    default: "pending",
  },
  refundId: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
