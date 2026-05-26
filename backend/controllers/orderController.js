import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
import Coupon from "../models/Coupon.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import {
  createRazorpayOrder,
  verifyRazorpayPaymentSignature,
  processRazorpayRefund,
} from "../services/razorpay.service.js";
import crypto from "crypto";
import {
  sendNotificationToUser,
  sendNotificationToSeller,
  sendNotificationToAdmin,
} from "../services/socket.service.js";
import { sendEmail } from "../services/email.service.js";

// Create a new order & initiate payment
export const createOrder = async (req, res, next) => {
  try {
    const { items, couponCode, shippingAddress, paymentMethodId } = req.body;
    const paymentMethod = req.body.paymentMethod || paymentMethodId || "razorpay";
    const allowedPaymentMethods = ["razorpay", "cod"];

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items in the order" });
    }

    if (!allowedPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    let subTotal = 0;
    const orderItems = [];

    // Verify stock and calculate price
    for (const item of items) {
      const qty = Number(item.qty);
      if (!item.product || !Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({ message: "Invalid cart item quantity" });
      }

      const product = await Product.findById(item.product);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product ${item.product} not found` });
      }

      if (!product.isApproved) {
        return res.status(400).json({
          message: `${product.title} is not currently available for purchase`,
        });
      }

      if (product.stock < qty) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.title}. Available: ${product.stock}`,
        });
      }

      const itemPrice = product.price;
      subTotal += itemPrice * qty;

      orderItems.push({
        product: product._id,
        seller: product.seller,
        qty,
        price: itemPrice,
        variant: item.variant, // { name: 'Color', option: 'Black' }
      });
    }

    // Apply Coupon if exists
    let discountAmount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
      });
      if (
        coupon &&
        new Date() < coupon.expiresAt &&
        subTotal >= coupon.minOrderValue
      ) {
        if (coupon.discountType === "percentage") {
          discountAmount = (subTotal * coupon.discountValue) / 100;
        } else {
          discountAmount = coupon.discountValue;
        }

        // Cap usage limit check
        if (coupon.usedCount < coupon.maxUses) {
          coupon.usedCount += 1;
          await coupon.save();
        } else {
          discountAmount = 0; // reset
        }
      }
    }

    const totalPrice = Math.max(0, subTotal - discountAmount);

    let razorpayOrder = null;
    let razorpayAmount = 0;

    if (paymentMethod === "razorpay") {
      razorpayAmount = totalPrice * 100;
      razorpayOrder = await createRazorpayOrder(razorpayAmount, "INR");
    }

    // Create Order object in DB
    const order = new Order({
      user: req.user._id,
      products: orderItems,
      totalPrice,
      discountAmount,
      couponCode,
      paymentMethod,
      paymentStatus: "pending",
      paymentOrderId: razorpayOrder?.id || `cod_${Date.now()}`,
      orderStatus: "Placed",
      shippingAddress,
      trackingSteps: [
        {
          status: "Placed",
          description:
            paymentMethod === "cod"
              ? "Order was placed with Cash on Delivery."
              : "Order was successfully placed.",
        },
      ],
    });

    await order.save();

    // Deduct stock levels in parallel
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.qty },
      });

      // Real-time notification to Seller
      const noticeMessage = `New order placed for your item. Quantity: ${item.qty}`;
      sendNotificationToSeller(
        item.seller,
        "NEW_ORDER",
        noticeMessage,
        `/seller/orders`,
      );
    }

    // Clear Customer Cart
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    // Send notifications to Admin
    sendNotificationToAdmin(
      "NEW_ORDER",
      `New platform order placed: #${order._id}`,
      "/admin/orders",
    );

    if (paymentMethod === "cod") {
      const customer = await User.findById(order.user);
      if (customer) {
        await sendEmail({
          to: customer.email,
          subject: `NexMart - COD Order Confirmed #${order._id}`,
          html: `<p>Dear ${customer.name},</p><p>Your Cash on Delivery order #${order._id} has been placed successfully.</p><p><strong>Amount due on delivery:</strong> â‚¹${order.totalPrice.toLocaleString()}</p>`,
        });
      }
    }

    res.status(201).json({
      message:
        paymentMethod === "cod"
          ? "COD order placed successfully"
          : "Order initiated",
      orderId: order._id,
      paymentMethod,
      paymentStatus: order.paymentStatus,
      razorpayOrderId: razorpayOrder?.id || "",
      razorpayAmount: razorpayOrder?.amount || 0,
      currency: razorpayOrder?.currency || "INR",
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
      totalPrice,
    });
  } catch (error) {
    next(error);
  }
};

// Confirm payment completion
export const confirmPayment = async (req, res, next) => {
  try {
    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } =
      req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.paymentMethod !== "razorpay") {
      return res
        .status(400)
        .json({ message: "This order does not require Razorpay verification" });
    }

    if (order.paymentOrderId !== razorpayOrderId) {
      return res
        .status(400)
        .json({ message: "Invalid Razorpay order information" });
    }

    const isVerified = verifyRazorpayPaymentSignature({
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    });

    if (!isVerified) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    order.paymentStatus = "paid";
    order.paymentId = razorpayPaymentId;
    order.trackingSteps.push({
      status: "Payment Confirmed",
      description: "Razorpay transaction completed successfully.",
    });
    await order.save();

    // Save Payment Log
    const payment = new Payment({
      order: order._id,
      user: order.user,
      amount: order.totalPrice,
      currency: "INR",
      paymentGatewayId: razorpayPaymentId,
      paymentOrderId: order.paymentOrderId,
      gateway: "razorpay",
      status: "succeeded",
    });
    await payment.save();

    // Send Email invoice
    const customer = await User.findById(order.user);
    if (customer) {
      const emailSubject = `NexMart - Order Confirmed #${order._id}`;
      const emailHtml = `
        <h3>Thank you for your order, ${customer.name}!</h3>
        <p>Your order #${order._id} has been paid and is being prepared for shipment.</p>
        <p><strong>Total Paid:</strong> ₹${order.totalPrice.toLocaleString()}</p>
        <p>Delivery Address: ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.zipCode}</p>
      `;
      await sendEmail({
        to: customer.email,
        subject: emailSubject,
        html: emailHtml,
      });
    }

    res.status(200).json({ message: "Payment confirmed successfully", order });
  } catch (error) {
    next(error);
  }
};

// Get logged-in user orders
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("products.product", "title images price")
      .sort("-createdAt");

    res.status(200).json({ orders });
  } catch (error) {
    next(error);
  }
};

// Get all orders for admin
export const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("products.product", "title images price")
      .sort("-createdAt");

    res.status(200).json({ orders });
  } catch (error) {
    next(error);
  }
};

// Get Order Details
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("products.product", "title images brand price stock")
      .populate("products.seller", "name email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Auth check: Customer, Seller of an item, or Admin
    const isCustomer = order.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    const isSeller = order.products.some(
      (p) => p.seller._id.toString() === req.user._id.toString(),
    );

    if (!isCustomer && !isAdmin && !isSeller) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this order details" });
    }

    res.status(200).json({ order });
  } catch (error) {
    next(error);
  }
};

// Update order shipping milestones (Seller/Admin)
export const updateShippingStatus = async (req, res, next) => {
  try {
    const { status, description } = req.body;
    const allowedStatuses = [
      "Placed",
      "Packed",
      "Shipped",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
      "Returned",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Ensure status is valid transition
    order.orderStatus = status;
    // If order is marked as Delivered, also set paymentStatus to "paid"
    if (status === "Delivered") {
      order.paymentStatus = "paid";
      order.trackingSteps.push({
        status: "Payment Confirmed",
        description: "Payment marked as paid upon delivery.",
      });
    }
    order.trackingSteps.push({
      status,
      description: description || `Status updated to ${status}`,
    });
    await order.save();

    // Trigger user socket push notification
    sendNotificationToUser(
      order.user,
      "ORDER_STATUS",
      `Your order status has been updated to: ${status}`,
      `/dashboard/orders`,
    );

    // Send status update email
    const customer = await User.findById(order.user);
    if (customer) {
      await sendEmail({
        to: customer.email,
        subject: `NexMart - Order Status Update: ${status}`,
        html: `<p>Dear ${customer.name},</p><p>Your order #${order._id} status is now <strong>${status}</strong>.</p><p>${description || ""}</p>`,
      });
    }

    res
      .status(200)
      .json({ message: "Order status updated successfully", order });
  } catch (error) {
    next(error);
  }
};

// Process Return and Refund (Seller/Admin)
export const handleReturnRefund = async (req, res, next) => {
  try {
    const { refundAmount } = req.body; // Partial or full refund amount
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.paymentStatus !== "paid") {
      return res
        .status(400)
        .json({ message: "Only paid orders can be refunded" });
    }

    const razorpayRefundAmount = refundAmount
      ? refundAmount * 100
      : order.totalPrice * 100;
    const razorpayPaymentId = order.paymentId || order.paymentOrderId;

    if (!razorpayPaymentId) {
      return res
        .status(400)
        .json({ message: "No valid payment reference found for refund" });
    }

    const refund = await processRazorpayRefund(
      razorpayPaymentId,
      razorpayRefundAmount,
    );

    order.paymentStatus = "refunded";
    order.orderStatus = "Returned";
    order.trackingSteps.push({
      status: "Refunded",
      description: `Refund of ₹${(razorpayRefundAmount / 100).toLocaleString()} processed.`,
    });
    await order.save();

    // Update payment record in database
    await Payment.findOneAndUpdate(
      { order: order._id },
      { status: "refunded", refundId: refund.id },
    );

    // Restock items
    for (const item of order.products) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.qty },
      });
    }

    sendNotificationToUser(
      order.user,
      "ORDER_STATUS",
      `Refund processed for order #${order._id}`,
      `/dashboard/orders`,
    );

    res
      .status(200)
      .json({ message: "Refund successfully completed via Razorpay", order });
  } catch (error) {
    next(error);
  }
};

// Print Shipping Label (HTML template representation)
export const printShippingLabel = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("products.product", "title brand");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const labelHtml = `
      <html>
        <head>
          <style>
            body { font-family: monospace; padding: 20px; border: 3px dashed black; max-width: 500px; margin: auto; }
            .header { text-align: center; font-size: 24px; font-weight: bold; border-bottom: 2px solid black; padding-bottom: 10px; }
            .section { margin: 15px 0; }
            .barcode { font-size: 32px; letter-spacing: 2px; text-align: center; padding: 10px; background-color: #eee; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="header">NEXMART SHIPMENT</div>
          <div class="section">
            <strong>ORDER ID:</strong> #${order._id}<br/>
            <strong>DATE:</strong> ${new Date(order.createdAt).toLocaleDateString()}<br/>
            <strong>STATUS:</strong> ${order.orderStatus}
          </div>
          <hr/>
          <div class="section">
            <strong>SHIP TO:</strong><br/>
            ${order.user.name}<br/>
            ${order.shippingAddress.street}<br/>
            ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.zipCode}<br/>
            ${order.shippingAddress.country}
          </div>
          <hr/>
          <div class="section">
            <strong>ITEMS:</strong><br/>
            ${order.products.map((p) => `- [x${p.qty}] ${p.product.title}`).join("<br/>")}
          </div>
          <div class="barcode">||| *${order._id}* |||</div>
        </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html");
    res.status(200).send(labelHtml);
  } catch (error) {
    next(error);
  }
};

// Export Orders as CSV (Admin only)
export const exportOrdersCsv = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort("-createdAt");

    let csvContent =
      "OrderID,CustomerName,CustomerEmail,TotalPrice,PaymentStatus,OrderStatus,CreatedAt\n";

    orders.forEach((order) => {
      csvContent += `"${order._id}","${order.user.name}","${order.user.email}",${order.totalPrice},"${order.paymentStatus}","${order.orderStatus}","${new Date(order.createdAt).toISOString()}"\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=nexmart_orders.csv",
    );
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

// Razorpay webhook receiver (raw body required)
export const handleRazorpayWebhook = async (req, res, next) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
    const signature = (req.headers["x-razorpay-signature"] || "").toString();

    // Acquire raw body: express.raw middleware will provide a Buffer
    const raw =
      req.body && Buffer.isBuffer(req.body)
        ? req.body.toString()
        : JSON.stringify(req.body);

    if (!webhookSecret) {
      console.warn(
        "Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET is not configured.",
      );
      return res.status(400).send("Webhook secret not configured");
    }

    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(raw)
      .digest("hex");
    if (expected !== signature) {
      console.warn("Razorpay webhook signature mismatch");
      return res.status(400).send("Invalid signature");
    }

    const payload =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const event = payload.event || "";

    // Payment captured / authorized
    if (
      event === "payment.captured" ||
      event === "payment.authorized" ||
      event === "order.paid"
    ) {
      const paymentEntity = payload?.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;
      const status = paymentEntity?.status;

      if (orderId) {
        const order = await Order.findOne({ paymentOrderId: orderId });
        if (order) {
          if (
            status === "captured" ||
            status === "paid" ||
            status === "authorized"
          ) {
            order.paymentStatus = "paid";
            order.paymentId = paymentId;
            order.trackingSteps.push({
              status: "Payment Confirmed",
              description: `Payment captured via webhook (${paymentId}).`,
            });
            await order.save();

            await Payment.create({
              order: order._id,
              user: order.user,
              amount: order.totalPrice,
              currency: "INR",
              paymentGatewayId: paymentId,
              paymentOrderId: order.paymentOrderId,
              gateway: "razorpay",
              status: "succeeded",
            }).catch(() => {});

            sendNotificationToUser(
              order.user,
              "ORDER_PAY",
              `Payment received for order #${order._id}`,
              `/dashboard/orders`,
            );
          }
        }
      }
    }

    // Refund processed
    if (event && event.toLowerCase().includes("refund")) {
      const refundEntity = payload?.payload?.refund?.entity;
      const paymentId = refundEntity?.payment_id;
      const refundId = refundEntity?.id;
      const amount = refundEntity?.amount;

      // Find payment record and mark refunded
      const paymentRecord = await Payment.findOne({
        paymentGatewayId: paymentId,
      });
      if (paymentRecord) {
        paymentRecord.status = "refunded";
        paymentRecord.refundId = refundId;
        await paymentRecord.save();

        const order = await Order.findById(paymentRecord.order);
        if (order) {
          order.paymentStatus = "refunded";
          order.orderStatus = "Returned";
          order.trackingSteps.push({
            status: "Refunded",
            description: `Refund ${refundId} processed for ₹${(amount / 100).toLocaleString()}`,
          });
          await order.save();
          sendNotificationToUser(
            order.user,
            "ORDER_REFUND",
            `Refund processed for order #${order._id}`,
            `/dashboard/orders`,
          );
        }
      }
    }

    // Acknowledge
    res.status(200).send("ok");
  } catch (error) {
    next(error);
  }
};
