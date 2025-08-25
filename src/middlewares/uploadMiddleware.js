import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinaryConfig.js';

// 📂 Setup storage engine with Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'uploads', // change folder name if needed
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  },
});

// 📌 Multer middleware for file upload
const upload = multer({ storage });

export default upload;
