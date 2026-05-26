import mongoose from "mongoose";
import { config } from "dotenv";
import connectDB from "../config/db.js";
import Cart from "../models/Cart.js";
import Category from "../models/Category.js";
import Chat from "../models/Chat.js";
import Coupon from "../models/Coupon.js";
import Notification from "../models/Notification.js";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import Product from "../models/Product.js";
import Review from "../models/Review.js";
import SellerProfile from "../models/SellerProfile.js";
import User from "../models/User.js";
import Wishlist from "../models/Wishlist.js";
import { indexAllProducts } from "../services/ai.service.js";

config();

const password = "Password123";
const thirtyDaysFromNow = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
const fiveDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 5);

const clearDatabase = async () => {
  console.log("Clearing database...");
  await Promise.all([
    Cart.deleteMany(),
    Category.deleteMany(),
    Chat.deleteMany(),
    Coupon.deleteMany(),
    Notification.deleteMany(),
    Order.deleteMany(),
    Payment.deleteMany(),
    Product.deleteMany(),
    Review.deleteMany(),
    SellerProfile.deleteMany(),
    User.deleteMany(),
    Wishlist.deleteMany(),
  ]);
};

const seedData = async () => {
  try {
    await connectDB();
    await clearDatabase();

    console.log("Seeding categories...");
    const [electronics, fashion, home] = await Category.create([
      { name: "Electronics", slug: "electronics", icon: "Cpu" },
      { name: "Fashion", slug: "fashion", icon: "Shirt" },
      { name: "Home & Kitchen", slug: "home-kitchen", icon: "Home" },
    ]);

    const [wearables, audio, computers, accessories] = await Category.create([
      {
        name: "Wearables",
        slug: "wearables",
        icon: "Watch",
        parentCategory: electronics._id,
      },
      {
        name: "Audio",
        slug: "audio",
        icon: "Headphones",
        parentCategory: electronics._id,
      },
      {
        name: "Computers",
        slug: "computers",
        icon: "Laptop",
        parentCategory: electronics._id,
      },
      {
        name: "Accessories",
        slug: "accessories",
        icon: "ShoppingBag",
        parentCategory: fashion._id,
      },
    ]);

    console.log("Seeding users...");
    const [admin, sellerUser, customer, secondCustomer] = await User.create([
      {
        name: "NexMart Admin",
        email: "admin@nexmart.com",
        password,
        role: "admin",
        isVerified: true,
      },
      {
        name: "Alpha Tech Store",
        email: "seller@nexmart.com",
        password,
        role: "seller",
        isVerified: true,
        sellerStatus: "approved",
      },
      {
        name: "John Doe",
        email: "customer@nexmart.com",
        password,
        role: "customer",
        isVerified: true,
        addresses: [
          {
            street: "123 Tech Lane",
            city: "Bangalore",
            state: "Karnataka",
            zipCode: "560001",
            country: "India",
            isDefault: true,
          },
        ],
      },
      {
        name: "Priya Sharma",
        email: "priya@nexmart.com",
        password,
        role: "customer",
        isVerified: true,
        addresses: [
          {
            street: "44 Market Road",
            city: "Mumbai",
            state: "Maharashtra",
            zipCode: "400001",
            country: "India",
            isDefault: true,
          },
        ],
      },
    ]);

    console.log("Seeding seller profile...");
    await SellerProfile.create({
      user: sellerUser._id,
      shopName: "Alpha Tech Store",
      shopLogo:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150",
      shopBanner:
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800",
      description:
        "Your premier source for advanced consumer electronics and gadgets.",
      gstNumber: "29AAAAA1111A1Z1",
      bankDetails: {
        accountNumber: "1234567890",
        ifscCode: "HDFC0000123",
        bankName: "HDFC Bank",
        accountHolderName: "Alpha Tech Store Private Limited",
      },
      isVerified: true,
      totalRevenue: 64958,
    });

    console.log("Seeding products...");
    const products = await Product.create([
      {
        title: "AeroBook Pro 15",
        description:
          "Ultra-thin metal chassis laptop powered by the latest Intel i7 processor, 16GB LPDDR5 RAM, and 512GB NVMe SSD. Features a gorgeous 15.6 inch IPS color-accurate screen.",
        category: computers._id,
        brand: "Aero",
        price: 59999,
        comparePrice: 69999,
        stock: 25,
        images: [
          "https://images.unsplash.com/photo-1496181130204-7552cc145cdb?w=600&auto=format&fit=crop&q=60",
          "https://images.unsplash.com/photo-1527689368864-3a821dbccc34?w=600&auto=format&fit=crop&q=60",
        ],
        variants: [
          { name: "Color", options: ["Space Gray", "Silver"] },
          { name: "Storage", options: ["512GB SSD", "1TB SSD"] },
        ],
        seller: sellerUser._id,
        isApproved: true,
        isFeatured: true,
        tags: ["laptop", "productivity", "intel", "thin-and-light"],
      },
      {
        title: "SoundWave X1 ANC",
        description:
          "Active Noise Cancelling over-ear wireless headphones. Premium audio driver tuning with 40-hour long-lasting battery life. Features dual-mic voice isolation.",
        category: audio._id,
        brand: "SoundWave",
        price: 4999,
        comparePrice: 7999,
        stock: 50,
        images: [
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=60",
          "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&auto=format&fit=crop&q=60",
        ],
        variants: [{ name: "Color", options: ["Matte Black", "Alpine White"] }],
        seller: sellerUser._id,
        isApproved: true,
        isFeatured: true,
        tags: ["headphones", "anc", "wireless", "audio"],
      },
      {
        title: "Aura Fit Watch S2",
        description:
          "Always-on AMOLED display smartwatch. Real-time heart rate monitor, blood oxygen tracker, and 24 sport activities. Integrates NFC and notification pushes.",
        category: wearables._id,
        brand: "Aura",
        price: 2999,
        comparePrice: 4999,
        stock: 10,
        images: [
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=60",
          "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=600&auto=format&fit=crop&q=60",
        ],
        variants: [{ name: "Strap", options: ["Black Silicone", "Leather Brown"] }],
        seller: sellerUser._id,
        isApproved: true,
        isFeatured: true,
        tags: ["smartwatch", "fitness", "amoled", "tracker"],
      },
      {
        title: "Apex Phone Neo 5G",
        description:
          "Elite gaming mobile phone, 120Hz refresh AMOLED display, 5000mAh battery with fast charging. Currently sold out due to high demand.",
        category: electronics._id,
        brand: "Apex",
        price: 24999,
        comparePrice: 29999,
        stock: 0,
        images: [
          "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=60",
        ],
        variants: [{ name: "Color", options: ["Eclipse Black", "Aurora Gold"] }],
        seller: sellerUser._id,
        isApproved: true,
        isFeatured: false,
        tags: ["mobile", "gaming", "5g", "android"],
      },
      {
        title: "Everyday Canvas Tote",
        description:
          "Durable cotton canvas tote bag with reinforced handles and roomy storage for daily shopping, office, and travel essentials.",
        category: accessories._id,
        brand: "UrbanCarry",
        price: 799,
        comparePrice: 1199,
        stock: 80,
        images: [
          "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&auto=format&fit=crop&q=60",
        ],
        variants: [{ name: "Color", options: ["Natural", "Olive", "Black"] }],
        seller: sellerUser._id,
        isApproved: true,
        isFeatured: false,
        tags: ["bag", "canvas", "tote", "daily-use"],
      },
      {
        title: "ChefMate Steel Pan 28cm",
        description:
          "Tri-ply stainless steel frying pan with induction-ready base, cool-touch handle, and even heat distribution for home cooking.",
        category: home._id,
        brand: "ChefMate",
        price: 1899,
        comparePrice: 2499,
        stock: 34,
        images: [
          "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=600&auto=format&fit=crop&q=60",
        ],
        variants: [{ name: "Size", options: ["24cm", "28cm"] }],
        seller: sellerUser._id,
        isApproved: true,
        isFeatured: false,
        tags: ["kitchen", "pan", "steel", "induction"],
      },
    ]);

    const [laptop, headphones, smartwatch] = products;

    console.log("Seeding reviews...");
    await Review.create([
      {
        user: customer._id,
        product: headphones._id,
        rating: 5,
        title: "Outstanding sound quality!",
        body: "I was blown away by the active noise cancellation. It blocks out city traffic and stays comfortable for long calls.",
        helpful: [admin._id],
      },
      {
        user: secondCustomer._id,
        product: laptop._id,
        rating: 4,
        title: "Great daily work laptop",
        body: "Fast boot, nice display, and light enough to carry. I wish the base model had more storage.",
      },
      {
        user: customer._id,
        product: smartwatch._id,
        rating: 4,
        title: "Good value fitness watch",
        body: "Battery life is solid and the AMOLED screen looks crisp outdoors.",
      },
    ]);

    await Promise.all(products.map((product) => Review.calculateAverageRating(product._id)));

    console.log("Seeding cart, wishlist, and order...");
    await Cart.create({
      user: customer._id,
      items: [
        {
          product: smartwatch._id,
          qty: 1,
          variant: { name: "Strap", option: "Black Silicone" },
        },
      ],
    });

    await Wishlist.create({
      user: customer._id,
      products: [laptop._id, headphones._id],
    });

    const order = await Order.create({
      user: customer._id,
      products: [
        {
          product: headphones._id,
          seller: sellerUser._id,
          qty: 1,
          price: headphones.price,
          variant: { name: "Color", option: "Matte Black" },
        },
        {
          product: smartwatch._id,
          seller: sellerUser._id,
          qty: 1,
          price: smartwatch.price,
          variant: { name: "Strap", option: "Black Silicone" },
        },
      ],
      totalPrice: headphones.price + smartwatch.price - 500,
      discountAmount: 500,
      couponCode: "FLAT500",
      paymentStatus: "paid",
      paymentOrderId: "order_seed_001",
      paymentId: "pay_seed_001",
      orderStatus: "Shipped",
      shippingAddress: customer.addresses[0],
      trackingSteps: [
        {
          status: "Placed",
          timestamp: fiveDaysAgo,
          description: "Order confirmed.",
        },
        {
          status: "Packed",
          timestamp: new Date(fiveDaysAgo.getTime() + 1000 * 60 * 60 * 8),
          description: "Items packed by seller.",
        },
        {
          status: "Shipped",
          timestamp: new Date(fiveDaysAgo.getTime() + 1000 * 60 * 60 * 24),
          description: "Package handed to courier.",
        },
      ],
      createdAt: fiveDaysAgo,
    });

    await Payment.create({
      order: order._id,
      user: customer._id,
      amount: order.totalPrice,
      paymentGatewayId: "pay_seed_001",
      paymentOrderId: "order_seed_001",
      status: "succeeded",
    });

    console.log("Seeding coupons and notifications...");
    await Coupon.create([
      {
        code: "WELCOME10",
        discountType: "percentage",
        discountValue: 10,
        minOrderValue: 1000,
        maxUses: 200,
        usedCount: 0,
        expiresAt: thirtyDaysFromNow,
        isActive: true,
      },
      {
        code: "FLAT500",
        discountType: "flat",
        discountValue: 500,
        minOrderValue: 5000,
        maxUses: 100,
        usedCount: 1,
        expiresAt: thirtyDaysFromNow,
        isActive: true,
      },
    ]);

    await Notification.create([
      {
        user: admin._id,
        type: "SELLER_APPROVED",
        message: "Alpha Tech Store is approved and active.",
        link: "/admin/sellers",
        isRead: true,
      },
      {
        user: sellerUser._id,
        type: "NEW_ORDER",
        message: "You received a new paid order from John Doe.",
        link: `/seller/orders/${order._id}`,
      },
      {
        user: customer._id,
        type: "ORDER_STATUS",
        message: "Your order has been shipped.",
        link: `/orders/${order._id}`,
      },
    ]);

    console.log("Seeding AI chat history...");
    await Chat.create({
      user: customer._id,
      sessionId: "seed-session",
      messages: [
        {
          role: "user",
          content: "Suggest headphones under 6000",
        },
        {
          role: "assistant",
          content:
            "SoundWave X1 ANC is a strong pick under Rs. 6000 with ANC, wireless audio, and 40-hour battery life.",
          sources: [`Product ID: ${headphones._id}`],
        },
      ],
    });

    console.log("Indexing approved products for AI search...");
    await indexAllProducts();

    console.log("Database seeded successfully.");
    console.log("Demo logins:");
    console.log(`Admin: admin@nexmart.com / ${password}`);
    console.log(`Seller: seller@nexmart.com / ${password}`);
    console.log(`Customer: customer@nexmart.com / ${password}`);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedData();
