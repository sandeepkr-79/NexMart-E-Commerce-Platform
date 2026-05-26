import Razorpay from "razorpay";
import { config } from "dotenv";
config();

const razorpayKeyId = process.env.RAZORPAY_KEY_ID || "";
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || "";
let razorpay = null;

if (razorpayKeyId && razorpayKeySecret) {
  razorpay = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret,
  });
  console.log("Razorpay SDK loaded successfully.");
} else {
  console.log(
    "Razorpay credentials missing. Running in simulated checkout mode.",
  );
  razorpay = {
    orders: {
      create: async ({ amount, currency }) => ({
        id: `order_mock_${Math.random().toString(36).substring(2, 15)}`,
        amount,
        currency,
        status: "created",
      }),
    },
    payments: {
      refund: async ({ payment_id, amount }) => ({
        id: `refund_mock_${Math.random().toString(36).substring(2, 15)}`,
        payment_id,
        amount,
        status: "processed",
      }),
    },
  };
}

export default razorpay;
export { razorpayKeyId, razorpayKeySecret };
