import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nexmart');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.warn('Backend is running, but MongoDB connection failed. Please ensure MongoDB is running locally or set MONGO_URI.');
    // Do not crash the application, allow testing other API fallbacks if appropriate, or throw
    process.exit(1);
  }
};

export default connectDB;
