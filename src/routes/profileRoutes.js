import express from "express";
import verifyToken from "../middlewares/authMiddleware.js";
import {
    getProfile,
    
    deleteProfileImage,
    updateProfileInfo,
    updateProfileImage,
} from "../controllers/profileController.js";
import { upload } from "../middlewares/upload.js";

const profileRouter = express.Router();

// 🔐 Get Profile
profileRouter.get("/profile", verifyToken, getProfile);

// ✏️ Update Profile (with optional image)
profileRouter.patch(
    "/profile",
    verifyToken,

    updateProfileInfo
);
profileRouter.put(
    "/profile/image",
    verifyToken,
    upload.single("profileImage"),
    updateProfileImage
);


// 🗑 Delete profile image only
profileRouter.delete(
    "/profile/image",
    verifyToken,
    deleteProfileImage
);

export default profileRouter;