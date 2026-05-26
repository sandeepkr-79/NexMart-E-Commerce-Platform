import express from 'express';
import http from 'http';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import xss from 'xss-clean';
import { config } from 'dotenv';
import connectDB from './config/db.js';
import { initSocket } from './services/socket.service.js';
import { indexAllProducts } from './services/ai.service.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import sellerRoutes from './routes/sellerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import couponRoutes from './routes/couponRoutes.js';

config();

const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB().then(() => {
  // Initialize AI Vector store indexes from database
  console.log('Initializing AI vector database indexing...');
  indexAllProducts().catch(err => console.error('Initial product indexing failed:', err.message));
});

// Initialize Socket.io
initSocket(server);

// Middleware Configurations
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(xss());

const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Test Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'NexMart API is healthy and running.' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`NexMart server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
