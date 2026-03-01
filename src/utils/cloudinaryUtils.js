import cloudinary from "../config/cloudinary.js";

export const uploadToCloudinary = async (filePath, folder) => {
  return cloudinary.uploader.upload(filePath, { folder });
};

export const deleteFromCloudinary = async (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};