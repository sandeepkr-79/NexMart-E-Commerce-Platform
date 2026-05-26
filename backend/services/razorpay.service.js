import crypto from "crypto";
import razorpay, { razorpayKeySecret } from "../config/razorpay.js";

export const createRazorpayOrder = async (amount, currency = "INR") => {
  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amount),
      currency,
    });
    return order;
  } catch (error) {
    console.error("Razorpay createOrder Error:", error?.message || error);
    throw new Error(
      `Razorpay order creation failed: ${error?.message || error}`,
    );
  }
};

export const verifyRazorpayPaymentSignature = ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  if (!razorpayKeySecret) {
    return true;
  }

  const generatedSignature = crypto
    .createHmac("sha256", razorpayKeySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  return generatedSignature === razorpay_signature;
};

export const processRazorpayRefund = async (paymentId, amount = null) => {
  try {
    const refundRequest = { payment_id: paymentId };
    if (amount) {
      refundRequest.amount = Math.round(amount);
    }
    const refund = await razorpay.payments.refund(refundRequest);
    return refund;
  } catch (error) {
    console.error("Razorpay processRefund Error:", error?.message || error);
    throw new Error(`Razorpay refund failed: ${error?.message || error}`);
  }
};
