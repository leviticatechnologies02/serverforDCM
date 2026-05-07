import mongoose from 'mongoose';
import User from '../../../models/user.js';
import Batch from '../../../models/batch.js';
import Course from '../../../models/courses.js';
import Enrollment from '../../../models/Enrollment.js';
import ApiError from '../../../utils/ApiError.js';
import { getContactEmailHTML, getBatchAssignmentEmailHTML } from '../../../utils/email/generateHTML.js';
import { sendEmail } from '../../../utils/email/sendEmail.js';
import logger from '../../../utils/logger.js';
import ExcelJS from 'exceljs';

export class AdminService {
  // 1. Dashboard Stats
  static async getAdminStats() {
    const [verifiedUsers, batches, enrollments, courses] = await Promise.all([
      User.countDocuments({ emailVerified: true }),
      Batch.countDocuments(),
      Enrollment.countDocuments(),
      Course.countDocuments()
    ]);

    return { verifiedUsers, batches, enrollments, courses };
  }

  // 2. Contact Submission
  static async submitContactForm({ name, email, message, mobile }) {
    if (!name || !email || !message) {
      throw new ApiError(400, 'All fields are required.');
    }

    await sendEmail({
      to: 'leviticatechnologies@gmail.com',
      html: getContactEmailHTML(name, email, message, mobile),
      replyTo: email,
      subject: `New Contact Form Submission from ${name}`
    });

    return { message: 'Message sent successfully.' };
  }

  // 3. Admin User Management
  static async createAdmin({ name, email, password }) {
    if (!name || !email || !password) {
      throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(400, "User already exists");
    }

    const newAdmin = await User.create({
      name,
      email,
      password,
      role: "admin",
    });

    return {
      id: newAdmin._id,
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role,
    };
  }

  static async getAllAdmins() {
    const admins = await User.find({
      role: { $in: ["admin", "superadmin"] },
    }).select("-password");

    return admins;
  }

  static async getAdminById(id) {
    const admin = await User.findOne({
      _id: id,
      role: { $in: ["admin", "superadmin"] },
    }).select("-password");

    if (!admin) throw new ApiError(404, "Admin not found");
    return admin;
  }

  static async updateAdmin({ id, name, email, mobile }) {
    const admin = await User.findOne({
      _id: id,
      role: { $in: ["admin", "superadmin"] },
    });

    if (!admin) throw new ApiError(404, "Admin not found");

    admin.name = name ?? admin.name;
    admin.email = email ?? admin.email;
    admin.mobile = mobile ?? admin.mobile;

    await admin.save();
    return admin;
  }

  static async deleteAdmin({ id, requestUser }) {
    if (requestUser.role !== "superadmin") {
      throw new ApiError(403, "Access denied. Only superadmin can delete admins.");
    }

    const admin = await User.findOne({
      _id: id,
      role: { $in: ["admin", "superadmin"] },
    });

    if (!admin) throw new ApiError(404, "Admin not found");

    if (requestUser.id === admin._id.toString()) {
      throw new ApiError(400, "You cannot delete yourself");
    }

    await admin.deleteOne();
    return { message: "Admin deleted successfully" };
  }

  // 4. Batch Management
  static async getIdAndBatchNames() {
    const batches = await Batch.find({ status: "active" }, "_id batchName").sort({ createdAt: -1 });
    return batches;
  }

  static async getAllBatches({ status, page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;
    const filter = {};
    if (status) filter.status = status;

    const [batches, total] = await Promise.all([
      Batch.find(filter)
        .populate("courseId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Batch.countDocuments(filter),
    ]);

    return {
      batches,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  static async getBatchesByCourseId(courseId) {
    if (!courseId) throw new ApiError(400, "courseId is required");

    const batches = await Batch.find({ courseId, status: "active" }, "_id batchName")
      .sort({ createdAt: -1 })
      .lean();

    return batches;
  }

  static async getBatchDetails({ id, page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;

    const enrollments = await Enrollment.find({
      "enrolledCourses.batch": id,
    })
      .populate("user", "name email role")
      .populate("enrolledCourses.course", "name")
      .lean();

    if (!enrollments || enrollments.length === 0) {
      return {
        students: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }

    const allStudents = enrollments.flatMap((enrollment) =>
      enrollment.enrolledCourses
        .filter((c) => c.batch?.toString() === id)
        .map((c) => ({
          id: enrollment.user._id,
          name: enrollment.user.name,
          email: enrollment.user.email,
          role: enrollment.user.role,
          course: c.course?.name,
        }))
    );

    const total = allStudents.length;
    const students = allStudents.slice(skip, skip + limit);

    return {
      students,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async addBatch({ batchName, courseId, startDate, endDate }) {
    if (!batchName || !courseId || !startDate || !endDate) {
      throw new ApiError(400, 'All fields are required.');
    }

    if (new Date(endDate) < new Date(startDate)) {
      throw new ApiError(400, 'End date must be after start date.');
    }

    const existing = await Batch.findOne({ batchName, courseId });
    if (existing) {
      throw new ApiError(409, 'Batch with this name and course already exists.');
    }

    const batch = new Batch({ batchName, courseId, startDate, endDate });
    await batch.save();
    return batch;
  }

  static async updateBatch({ id, batchName, courseId, startDate, endDate, status, completedAt }) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid batch ID");
    }

    const batch = await Batch.findById(id);
    if (!batch) throw new ApiError(404, "Batch not found");

    if (batchName && batchName !== batch.batchName) {
      const exists = await Batch.findOne({ batchName });
      if (exists) throw new ApiError(409, "Batch name already exists");
      batch.batchName = batchName;
    }

    if (courseId) batch.courseId = courseId;
    if (startDate) batch.startDate = startDate;
    if (endDate) batch.endDate = endDate;

    if (status && status !== batch.status) {
      batch.status = status;
      if (status === "completed") {
        batch.completedAt = completedAt ? new Date(completedAt) : new Date();
      }
      if (status !== "completed") {
        batch.completedAt = null;
      }
    }

    if (batch.status === "completed" && completedAt && !batch.completedAt) {
      batch.completedAt = new Date(completedAt);
    }

    await batch.save();
    return batch;
  }

  static async deleteBatch(id) {
    const batch = await Batch.findById(id);
    if (!batch) throw new ApiError(404, 'Batch not found.');

    const enrollmentsWithBatch = await Enrollment.findOne({
      "enrolledCourses.batch": id
    });

    if (enrollmentsWithBatch) {
      throw new ApiError(400, 'Cannot delete batch. There are students enrolled in this batch. Please remove all enrollments first.');
    }

    await Batch.findByIdAndDelete(id);
    return {
      id: batch._id,
      batchName: batch.batchName
    };
  }

  static async completeBatch(id) {
    const batch = await Batch.findById(id);
    if (!batch) throw new ApiError(404, 'Batch not found.');

    if (batch.status === "completed") {
      throw new ApiError(400, 'Batch is already completed.');
    }

    const updatedBatch = await Batch.findByIdAndUpdate(
      id,
      {
        status: 'completed',
        completedAt: new Date()
      },
      { new: true }
    );

    return updatedBatch;
  }

  // 5. Batch Student Assignment
  static async getUnassignedEnrollments() {
    const enrollments = await Enrollment.aggregate([
      { 
        $project: {
          user: 1,
          enrolledCourses: {
            $filter: {
              input: "$enrolledCourses",
              as: "course",
              cond: { $eq: ["$$course.assigned", false] }
            }
          }
        }
      },
      {
        $match: {
          "enrolledCourses.0": { $exists: true }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          user: 1,
          enrolledCourses: 1
        }
      },
      { $unwind: "$enrolledCourses" },
      {
        $lookup: {
          from: "courses",
          localField: "enrolledCourses.course",
          foreignField: "_id",
          as: "enrolledCourses.course"
        }
      },
      { $unwind: "$enrolledCourses.course" },
      {
        $group: {
          _id: "$_id",
          user: { $first: "$user" },
          enrolledCourses: {
            $push: {
              course: "$enrolledCourses.course",
              availability: "$enrolledCourses.availability",
              enrolledAt: "$enrolledCourses.enrolledAt",
              assigned: "$enrolledCourses.assigned",
              batch: "$enrolledCourses.batch"
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          enrolledCourses: 1,
          user: {
            name: "$user.name",
            email: "$user.email",
            role: "$user.role"
          }
        }
      }
    ]);

    return enrollments;
  }

  static async assignStudentsToBatch({ enrollmentIds, courseId, batchId, courseTitle, batchName }) {
    if (!Array.isArray(enrollmentIds) || enrollmentIds.length === 0) {
      throw new ApiError(400, 'enrollmentIds must be a non-empty array');
    }

    const session = await mongoose.startSession();
    let updateResult;

    try {
      await session.withTransaction(async () => {
        const enrollments = await Enrollment.find(
          { _id: { $in: enrollmentIds } },
          { user: 1 }
        ).session(session);

        const userIds = enrollments.map(e => e.user).filter(Boolean);

        updateResult = await Enrollment.updateMany(
          { _id: { $in: enrollmentIds } },
          {
            $set: {
              'enrolledCourses.$[course].batch': batchId,
              'enrolledCourses.$[course].assigned': true
            }
          },
          {
            arrayFilters: [{ 'course.course': courseId }],
            session
          }
        );

        const UserData = await User.find({ _id: { $in: userIds } }).lean().session(session); 

        await Promise.allSettled(
          UserData.map(u =>
            sendEmail({
              to: u.email,
              subject: "Batch Assigned Successfully",
              html: getBatchAssignmentEmailHTML(
                u.name,
                courseTitle,
                batchName,
                u.email
              ),
            })
          )
        );
      });

      return {
        totalUpdated: updateResult?.modifiedCount || 0,
        totalRequests: enrollmentIds.length
      };
    } catch (error) {
      logger.error('Batch assignment error inside transaction: ', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async getAssignedEnrollments() {
    const enrollments = await Enrollment.aggregate([
      {
        $project: {
          user: 1,
          enrolledCourses: {
            $filter: {
              input: "$enrolledCourses",
              as: "course",
              cond: { $eq: ["$$course.assigned", true] }
            }
          }
        }
      },
      {
        $match: {
          "enrolledCourses.0": { $exists: true }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          user: 1,
          enrolledCourses: 1
        }
      },
      { $unwind: "$enrolledCourses" },
      {
        $lookup: {
          from: "courses",
          localField: "enrolledCourses.course",
          foreignField: "_id",
          as: "enrolledCourses.course"
        }
      },
      { $unwind: "$enrolledCourses.course" },
      {
        $lookup: {
          from: "batches",
          localField: "enrolledCourses.batch",
          foreignField: "_id",
          as: "enrolledCourses.batch"
        }
      },
      { $unwind: { path: "$enrolledCourses.batch", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$_id",
          user: { $first: "$user" },
          enrolledCourses: {
            $push: {
              course: "$enrolledCourses.course",
              availability: "$enrolledCourses.availability",
              enrolledAt: "$enrolledCourses.enrolledAt",
              assigned: "$enrolledCourses.assigned",
              batch: "$enrolledCourses.batch"
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          enrolledCourses: 1,
          user: {
            name: "$user.name",
            email: "$user.email",
            role: "$user.role"
          }
        }
      }
    ]);

    return enrollments;
  }

  // 6. Export Assigned Students preparation (returns configured workbook and batchName)
  static async exportBatchStudents(batchId) {
    if (!batchId) throw new ApiError(400, "batchId is required");

    const batch = await Batch.findById(batchId).select("batchName");
    if (!batch) throw new ApiError(404, "Batch not found");

    const enrollments = await Enrollment.aggregate([
      {
        $match: {
          "enrolledCourses.batch": batch._id,
          "enrolledCourses.assigned": true
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      { $unwind: "$enrolledCourses" },
      {
        $match: {
          "enrolledCourses.batch": batch._id,
          "enrolledCourses.assigned": true
        }
      },
      {
        $lookup: {
          from: "courses",
          localField: "enrolledCourses.course",
          foreignField: "_id",
          as: "enrolledCourses.course"
        }
      },
      { $unwind: "$enrolledCourses.course" },
      {
        $project: {
          userName: "$user.name",
          userEmail: "$user.email",
          courseName: "$enrolledCourses.course.name",
          enrolledAt: "$enrolledCourses.enrolledAt",
          batch: batch.batchName
        }
      }
    ]);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Batch Students");

    worksheet.columns = [
      { header: "Name", key: "userName", width: 25 },
      { header: "Email", key: "userEmail", width: 30 },
      { header: "Course", key: "courseName", width: 30 },
      { header: "Enrolled At", key: "enrolledAt", width: 20 },
      { header: "Batch", key: "batch", width: 20 }
    ];

    enrollments.forEach((student) => {
      worksheet.addRow({
        userName: student.userName,
        userEmail: student.userEmail,
        courseName: student.courseName,
        enrolledAt: new Date(student.enrolledAt).toLocaleDateString(),
        batch: student.batch
      });
    });

    return { workbook, batchName: batch.batchName };
  }
}

export default AdminService;
