// controllers/profileController.js
import Admin from '../models/admin.js';
import User from '../models/user.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryUtils.js';
import { hashPassword, comparePassword } from '../utils/hashPassword.js';

// Get Student Profile
export const getStudentProfile = async (req, res) => {
  try {
    const studentId = req.userAccount?.user.id || req.user?.userId || req.user?.id;


    if (!studentId) {
      return res.status(401).json({ error: "Student not authenticated" });
    }

    const student = await User.findById(studentId).select("name email role profileImage");

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({
      message: "Student profile fetched successfully",
      name: student.name,
      email: student.email,
      role: student.role,
      profileImage: student.profileImage?.url || null,
    });
  } catch (err) {
    console.error("Student profile error:", err);
    res.status(500).json({ error: "Server error fetching student profile" });
  }
};

// Get Admin Profile
export const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.userAccount?.user.id || req.user?.userId || req.user?.id;

    if (!adminId) {
      return res.status(401).json({ error: "Admin not authenticated" });
    }

    const admin = await Admin.findById(adminId).select("name email role profileImage");

    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    res.json({
      message: "Admin profile fetched successfully",
      name: admin.name,
      email: admin.email,
      role: admin.role,
      profileImage: admin.profileImage?.url || null,
    });
  } catch (err) {
    console.error("Admin profile error:", err);
    res.status(500).json({ error: "Server error fetching admin profile" });
  }
};

// Universal profile endpoint
export const getProfile = async (req, res) => {
  try {
    const userId = req.userAccount?.userId || req.user?.userId || req.user?.id;
    const userRole = req.userAccount?.role || req.user?.role;
    
    if (!userId || !userRole) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    let profile;
    if (userRole === 'admin') {
      profile = await Admin.findById(userId).select('name email role profileImage');
    } else {
      profile = await User.findById(userId).select('name email role profileImage');
    }

    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile fetched successfully',
      name: profile.name,
      email: profile.email,
      role: profile.role,
      profileImage: profile.profileImage?.url || null
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
};

// Update profile (including optional image)
export const updateProfile = async (req, res) => {
  try {
    const userId = req.userAccount?.user.id|| req.user?.userId || req.user?.id;
    const userRole = req.userAccount?.user.role || req.user?.role;
    const { name, email, currentPassword, newPassword } = req.body;
    
    if (!userId || !userRole) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    let user;
    if (userRole === 'admin') {
      user = await Admin.findById(userId);
    } else {
      user = await User.findById(userId);
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update basic info
    if (name) user.name = name;
    
    // Handle email change with validation
    if (email && email !== user.email) {
      const emailTaken = await isEmailTaken(email, userRole);
      if (emailTaken) {
        return res.status(409).json({ error: 'Email already taken' });
      }
      user.email = email;
    }

    // Handle password change
    if (currentPassword && newPassword) {
      const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      user.password = await hashPassword(newPassword);
    }

    // Handle profile image upload
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.path, `${userRole}_profiles`);
        
        // Delete old image if exists
        if (user.profileImage && user.profileImage.publicId) {
          await deleteFromCloudinary(user.profileImage.publicId);
        }

        user.profileImage = {
          url: result.secure_url,
          publicId: result.public_id
        };
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError);
        return res.status(500).json({ error: 'Failed to upload profile image' });
      }
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage?.url || null
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error updating profile' });
  }
};

// Delete profile image only
export const deleteProfileImage = async (req, res) => {
  try {
    const userId = req.userAccount?.user.id || req.user?.userId || req.user?.id;
    const userRole = req.userAccount?.user.role || req.user?.role;
    
    if (!userId || !userRole) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    let user;
    if (userRole === 'admin') {
      user = await Admin.findById(userId);
    } else {
      user = await User.findById(userId);
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.profileImage || !user.profileImage.publicId) {
      return res.status(400).json({ error: 'No profile image to delete' });
    }

    // Delete from Cloudinary
    await deleteFromCloudinary(user.profileImage.publicId);

    // Remove from user document
    user.profileImage = undefined;
    await user.save();

    res.status(200).json({ 
      message: 'Profile image deleted successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: null
      }
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete profile image' });
  }
};