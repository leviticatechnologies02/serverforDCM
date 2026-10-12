import Mentor from "../../models/mentor.js";
import User from "../../models/user.js";
import mongoose from "mongoose";

// Get mentors with pagination, filtering, and search
export const getMentors = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const filter = {};

    // 1. isActive Filter
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === "true";
    }

    // 2. Search Filter
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { mobile: searchRegex },
        { expertise: searchRegex }
      ];
    }

    // 3. Expertise Filter
    if (req.query.expertise) {
      filter.expertise = req.query.expertise;
    }

    // 4. Course Filter
    if (req.query.courseId) {
      if (mongoose.Types.ObjectId.isValid(req.query.courseId)) {
        filter.courses = req.query.courseId;
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid courseId parameter"
        });
      }
    }

    // Exec queries in parallel
    const [mentors, total] = await Promise.all([
      Mentor.find(filter)
        .populate("courses", "name")
        .populate("internshipDomains", "name focus level")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Mentor.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: mentors,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      }
    });

  } catch (error) {
    console.error("GET MENTORS ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch mentors"
    });
  }
};

// Get single mentor by ID
export const getMentorById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mentor ID"
      });
    }

    const mentor = await Mentor.findById(id)
      .populate("courses", "name")
      .populate("internshipDomains", "name focus level")
      .lean();
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: "Mentor not found"
      });
    }

    res.status(200).json({
      success: true,
      data: mentor
    });
  } catch (error) {
    console.error("GET MENTOR BY ID ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch mentor details"
    });
  }
};

// Create a new mentor (Superadmin only)
export const addMentor = async (req, res) => {
  try {
    if (req.user?.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin is authorized to create mentors",
      });
    }

    const {
      name,
      email,
      mobile,
      password,
      expertise,
      courses,
      internshipDomains,
      isActive,
      profileImage,
    } = req.body;

    // Validation
    if (!name || !email || !mobile) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and mobile are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if mentor record already exists
    const existingMentor = await Mentor.findOne({ email: normalizedEmail });
    if (existingMentor) {
      return res.status(409).json({
        success: false,
        message: "A mentor with this email already exists",
      });
    }

    // Check or create User account for mentor login
    let user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (user && user.role !== "mentor") {
      return res.status(409).json({
        success: false,
        message: `An account with this email already exists with role: ${user.role}`,
      });
    }

    const mentorPassword = password || "Mentor@123";

    if (!user) {
      user = new User({
        name,
        email: normalizedEmail,
        mobile,
        password: mentorPassword,
        role: "mentor",
        emailVerified: true,
        profileImage: profileImage?.url
          ? { url: profileImage.url, publicId: profileImage.publicId || "" }
          : undefined,
      });
      await user.save();
    } else {
      // Update existing user with mentor role & password
      user.role = "mentor";
      user.name = name;
      user.mobile = mobile;
      if (password) user.password = password;
      await user.save();
    }

    // Create Mentor document linked to User
    const mentor = new Mentor({
      name,
      email: normalizedEmail,
      mobile,
      userId: user._id,
      expertise: expertise || [],
      courses: courses || [],
      internshipDomains: internshipDomains || [],
      isActive: isActive !== undefined ? isActive : true,
      profileImage: profileImage || {},
    });

    await mentor.save();

    res.status(201).json({
      success: true,
      message: "Mentor created and login account activated successfully",
      data: mentor,
    });
  } catch (error) {
    console.error("ADD MENTOR ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create mentor",
    });
  }
};

// Update an existing mentor (Superadmin only)
export const updateMentor = async (req, res) => {
  try {
    if (req.user?.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin is authorized to update mentors",
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mentor ID",
      });
    }

    const {
      name,
      email,
      mobile,
      password,
      expertise,
      courses,
      internshipDomains,
      isActive,
      profileImage,
    } = req.body;

    const mentor = await Mentor.findById(id);
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: "Mentor not found",
      });
    }

    const normalizedEmail = email ? email.toLowerCase().trim() : mentor.email;

    // Email Uniqueness Check if email is being updated
    if (email && normalizedEmail !== mentor.email) {
      const existingMentor = await Mentor.findOne({ email: normalizedEmail });
      if (existingMentor) {
        return res.status(409).json({
          success: false,
          message: "A mentor with this email already exists",
        });
      }
      mentor.email = normalizedEmail;
    }

    if (name) mentor.name = name;
    if (mobile) mentor.mobile = mobile;
    if (expertise !== undefined) mentor.expertise = expertise;
    if (courses !== undefined) mentor.courses = courses;
    if (internshipDomains !== undefined) mentor.internshipDomains = internshipDomains;
    if (isActive !== undefined) mentor.isActive = isActive;
    if (profileImage !== undefined) mentor.profileImage = profileImage;

    await mentor.save();

    // Sync updates to corresponding User account
    const user = mentor.userId
      ? await User.findById(mentor.userId).select("+password")
      : await User.findOne({ email: mentor.email }).select("+password");

    if (user) {
      if (name) user.name = name;
      if (mobile) user.mobile = mobile;
      if (email) user.email = normalizedEmail;
      if (password) user.password = password;
      if (profileImage?.url) {
        user.profileImage = {
          url: profileImage.url,
          publicId: profileImage.publicId || "",
        };
      }
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: "Mentor updated successfully",
      data: mentor,
    });
  } catch (error) {
    console.error("UPDATE MENTOR ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update mentor",
    });
  }
};

// Delete a mentor (Superadmin only)
export const deleteMentor = async (req, res) => {
  try {
    if (req.user?.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin is authorized to delete mentors",
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mentor ID",
      });
    }

    const mentor = await Mentor.findById(id);
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: "Mentor not found",
      });
    }

    // Delete Mentor document
    await Mentor.findByIdAndDelete(id);

    // Also remove the login User account if role is mentor
    if (mentor.userId) {
      await User.findByIdAndDelete(mentor.userId);
    } else {
      await User.findOneAndDelete({ email: mentor.email, role: "mentor" });
    }

    res.status(200).json({
      success: true,
      message: "Mentor and login credentials removed successfully",
      deletedMentor: {
        id: mentor._id,
        name: mentor.name,
        email: mentor.email,
      },
    });
  } catch (error) {
    console.error("DELETE MENTOR ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete mentor",
    });
  }
};