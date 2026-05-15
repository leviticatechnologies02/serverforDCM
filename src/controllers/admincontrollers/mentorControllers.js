import Mentor from "../../models/mentor.js";
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

    const mentor = await Mentor.findById(id).populate("courses", "name").lean();
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

// Create a new mentor
export const addMentor = async (req, res) => {
  try {
    const { name, email, mobile, expertise, courses, isActive, profileImage } = req.body;

    // Validation
    if (!name || !email || !mobile) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and mobile are required"
      });
    }

    // Duplicate Check
    const existingMentor = await Mentor.findOne({ email });
    if (existingMentor) {
      return res.status(409).json({
        success: false,
        message: "A mentor with this email already exists"
      });
    }

    // Create Mentor
    const mentor = new Mentor({
      name,
      email,
      mobile,
      expertise: expertise || [],
      courses: courses || [],
      isActive: isActive !== undefined ? isActive : true,
      profileImage: profileImage || {}
    });

    await mentor.save();

    res.status(201).json({
      success: true,
      message: "Mentor created successfully",
      data: mentor
    });
  } catch (error) {
    console.error("ADD MENTOR ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create mentor"
    });
  }
};

// Update an existing mentor
export const updateMentor = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mentor ID"
      });
    }

    const { name, email, mobile, expertise, courses, isActive, profileImage } = req.body;

    const mentor = await Mentor.findById(id);
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: "Mentor not found"
      });
    }

    // Email Uniqueness Check if email is being updated
    if (email && email !== mentor.email) {
      const existingMentor = await Mentor.findOne({ email });
      if (existingMentor) {
        return res.status(409).json({
          success: false,
          message: "A mentor with this email already exists"
        });
      }
      mentor.email = email;
    }

    if (name) mentor.name = name;
    if (mobile) mentor.mobile = mobile;
    if (expertise !== undefined) mentor.expertise = expertise;
    if (courses !== undefined) mentor.courses = courses;
    if (isActive !== undefined) mentor.isActive = isActive;
    if (profileImage !== undefined) mentor.profileImage = profileImage;

    await mentor.save();

    res.status(200).json({
      success: true,
      message: "Mentor updated successfully",
      data: mentor
    });
  } catch (error) {
    console.error("UPDATE MENTOR ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update mentor"
    });
  }
};

// Delete a mentor
export const deleteMentor = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mentor ID"
      });
    }

    const mentor = await Mentor.findById(id);
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: "Mentor not found"
      });
    }

    await Mentor.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Mentor deleted successfully",
      deletedMentor: {
        id: mentor._id,
        name: mentor.name,
        email: mentor.email
      }
    });
  } catch (error) {
    console.error("DELETE MENTOR ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete mentor"
    });
  }
};