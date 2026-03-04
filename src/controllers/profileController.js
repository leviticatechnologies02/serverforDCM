import User from "../models/user.js";
import { deleteFromCloudinary, uploadToCloudinary } from "../utils/cloudinaryUtils.js";



export const getProfile = async (req, res) => {
  try {
    const { id } = req.user;

    const user = await User.findById(id).select(
      "name email role profileImage"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      message: "Profile fetched successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage?.url || null,
      },
    });

  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// controllers/profileController.js

export const updateProfileInfo = async (req, res) => {
  try {
    const { id } = req.user;
    const { name } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (name) user.name = name;

    await user.save();
    res.status(200).json({
      message: "Profile info updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.profileImage?.url || null,
      },
    });

  } catch (error) {
    console.error("Update profile info error:", error);
    res.status(500).json({ error: "Server error updating profile info" });
  }
};

export const updateProfileImage = async (req, res) => {
  try {
    const { id } = req.user;

  if (!req.file || !req.file.buffer) {
  return res.status(400).json({ error: "No image uploaded" });
}

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Upload new image
    const result = await uploadToCloudinary(
      req.file.buffer,
      `${user.role}_profiles`
    );

    // Delete old image if exists
    if (user.profileImage?.publicId) {
      await deleteFromCloudinary(user.profileImage.publicId);
    }

    user.profileImage = {
      url: result.secure_url,
      publicId: result.public_id,
    };

    await user.save();

    res.status(200).json({
      message: "Profile image updated successfully",
      profileImage: user.profileImage.url,
    });

  } catch (error) {
    console.error("Update profile image error:", error);
    res.status(500).json({ error: "Server error updating profile image" });
  }
};

export const deleteProfileImage = async (req, res) => {
  try {
    const { id } = req.user;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.profileImage?.publicId) {
      return res.status(400).json({ error: "No profile image to delete" });
    }

    await deleteFromCloudinary(user.profileImage.publicId);

    user.profileImage = undefined;
    await user.save();

    res.status(200).json({
      message: "Profile image deleted successfully",
      profileImage: null,
    });

  } catch (error) {
    console.error("Delete image error:", error);
    res.status(500).json({ error: "Server error deleting image" });
  }
};