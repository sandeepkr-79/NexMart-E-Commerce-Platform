import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    variant: {
      name: String,
      option: String,
    },
  },
  { _id: false },
);

const trackingStepSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    description: { type: String },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  products: [orderItemSchema],
  totalPrice: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  couponCode: { type: String, default: "" },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending",
  },
  paymentMethod: {
    type: String,
    enum: ["razorpay", "cod"],
    default: "razorpay",
  },
  paymentOrderId: { type: String, default: "" }, // Razorpay order ID or gateway order reference
  paymentId: { type: String, default: "" }, // Razorpay payment ID or gateway payment reference
  orderStatus: {
    type: String,
    enum: [
      "Placed",
      "Packed",
      "Shipped",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
      "Returned",
    ],
    default: "Placed",
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  trackingSteps: [trackingStepSchema],
  isPaidToSeller: { type: Boolean, default: false },
  isPaidToAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
