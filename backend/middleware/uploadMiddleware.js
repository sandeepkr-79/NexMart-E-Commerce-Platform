import multer from 'multer';
import path from 'path';

// Store files in memory as buffers
const storage = multer.memoryStorage();

// File check helper
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|pdf/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Invalid file type. Only JPEG, JPG, PNG images and PDF documents are allowed.'));
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
});

// Single file upload
export const uploadSingle = (fieldName) => upload.single(fieldName);

// Multiple files upload
export const uploadArray = (fieldName, maxCount = 5) => upload.array(fieldName, maxCount);

// Fields upload (e.g. shopLogo and shopBanner together)
export const uploadFields = (fieldsArray) => upload.fields(fieldsArray);
