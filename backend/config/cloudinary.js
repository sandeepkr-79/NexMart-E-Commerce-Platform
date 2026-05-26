import { v2 as cloudinary } from 'cloudinary';
import { config } from 'dotenv';
config();

const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('Cloudinary Connected successfully.');
} else {
  console.log('Cloudinary credentials missing. Images will fall back to beautiful placeholder/mock URLs.');
}

// Wrapper utility for image uploads
export const uploadImage = async (fileBufferOrPath, folder = 'nexmart') => {
  if (isCloudinaryConfigured) {
    try {
      // If it's a buffer, upload via stream
      if (Buffer.isBuffer(fileBufferOrPath)) {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder },
            (error, result) => {
              if (error) reject(error);
              else resolve({ secure_url: result.secure_url, public_id: result.public_id });
            }
          );
          uploadStream.end(fileBufferOrPath);
        });
      } else {
        // If it's a file path
        const result = await cloudinary.uploader.upload(fileBufferOrPath, { folder });
        return { secure_url: result.secure_url, public_id: result.public_id };
      }
    } catch (error) {
      console.error('Cloudinary real upload error, using fallback:', error.message);
    }
  }

  // Fallback: Mock uploading by returning high-quality placeholder URLs
  // Generate random IDs and use Unsplash mock URLs
  const randomId = Math.floor(Math.random() * 1000);
  const mockImages = [
    `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=60`, // Smartwatch
    `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=60`, // Headphones
    `https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60`, // Red Shoes
    `https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&auto=format&fit=crop&q=60`, // Shoe/Gadget
    `https://images.unsplash.com/photo-1527689368864-3a821dbccc34?w=600&auto=format&fit=crop&q=60`, // Work Setup
    `https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=60`, // Glasses
  ];
  
  const selectedUrl = mockImages[randomId % mockImages.length];

  return {
    secure_url: selectedUrl,
    public_id: `mock_public_id_${Date.now()}_${randomId}`,
  };
};

export default cloudinary;
