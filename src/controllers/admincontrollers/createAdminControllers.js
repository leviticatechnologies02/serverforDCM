import User from '../../models/user.js'

/* CREATE ADMIN */
export const createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const newAdmin = await User.create({
      name,
      email,
      password,
      role: "admin", // better than auto superadmin
    });

    return res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    console.error("Create Admin Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* GET ALL ADMINS */
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({
      role: { $in: ["admin", "superadmin"] },
    }).select("-password");

    return res.status(200).json({
      success: true,
      count: admins.length,
      data: admins,
    });
  } catch (error) {
    console.error("Get Admins Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* GET SINGLE ADMIN */
export const getAdminById = async (req, res) => {
  try {
    const admin = await User.findOne({
      _id: req.params.id,
      role: { $in: ["admin", "superadmin"] },
    }).select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: admin,
    });
  } catch (error) {
    console.error("Get Admin Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* UPDATE ADMIN */
export const updateAdmin = async (req, res) => {
  try {
    const { name, email, mobile } = req.body;

    const admin = await User.findOne({
      _id: req.params.id,
      role: { $in: ["admin", "superadmin"] },
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Prevent role change via this route
    admin.name = name ?? admin.name;
    admin.email = email ?? admin.email;
    admin.mobile = mobile ?? admin.mobile;

    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      data: admin,
    });
  } catch (error) {
    console.error("Update Admin Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/* DELETE ADMIN */
export const deleteAdmin = async (req, res) => {
  try {
    // 🔐 Only superadmin can delete admins
    if (req.user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only superadmin can delete admins.",
      });
    }

    const admin = await User.findOne({
      _id: req.params.id,
      role: { $in: ["admin", "superadmin"] },
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // ❌ Prevent self deletion
    if (req.user.id === admin._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete yourself",
      });
    }

    await admin.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Admin deleted successfully",
    });

  } catch (error) {
    console.error("Delete Admin Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};