import express from "express";
import multer from "multer";
import { uploadToCloudinary } from "../utils/cloudinaryUtils.js";
import Admin from "../models/admin.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" }); // temporary storage

// Upload + save profile image
router.post("/upload-profile/:adminId", upload.single("profileImage"), async (req, res) => {
  try {
    const { adminId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.path, "profiles");

    // Update admin document
    const admin = await Admin.findByIdAndUpdate(
      adminId,
      {
        profileImage: {
          url: result.secure_url,
          publicId: result.public_id,
        },
      },
      { new: true }
    );

    res.json({
      message: "Profile image uploaded successfully",
      profileImage: admin.profileImage,
    });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

export default router;
