
// src/utils/cloudinaryUtils.js
import dotenv from "dotenv";
dotenv.config();


import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload file to Cloudinary
export const uploadToCloudinary = async (filePath, folder = "profiles") => {
  return await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: "auto", // auto-detect image/video/pdf etc
  });
};

// Delete file from Cloudinary
export const deleteFromCloudinary = async (publicId) => {
  return await cloudinary.uploader.destroy(publicId);
};
