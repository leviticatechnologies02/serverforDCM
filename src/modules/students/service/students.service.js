import mongoose from 'mongoose';
import User from '../../../models/user.js';
import Course from '../../../models/courses.js';
import Enrollment from '../../../models/Enrollment.js';
import LiveClass from '../../../models/LiveClass.js';
import Cart from '../../../models/cart.js';
import ApiError from '../../../utils/ApiError.js';
import exceljs from 'exceljs';

export class StudentsService {
  // 1. Course Enrollment Business Logic
  static async enrollInCourses({ paymentId, userId, courseId, session }) {
    try {
      const result = await Enrollment.findOneAndUpdate(
        {
          user: userId,
          "enrolledCourses.course": { $ne: courseId }
        },
        {
          $addToSet: {
            enrolledCourses: {
              course: courseId,
              paymentId,
              assigned: false,
              batch: null,
              enrolledAt: new Date()
            }
          }
        },
        {
          session,
          new: true,
          upsert: true,
          setDefaultsOnInsert: true
        }
      );

      if (!result) {
        const existingEnrollment = await Enrollment.findOne({
          user: userId,
          "enrolledCourses.course": courseId
        }).session(session);

        if (existingEnrollment) {
          return existingEnrollment;
        }
      }

      return result;
    } catch (error) {
      if (error.code === 11000) {
        const existingEnrollment = await Enrollment.findOne({ user: userId }).session(session);
        return existingEnrollment;
      }
      throw error;
    }
  }

  static async getStudentEnrollmentByCourseId({ userId, courseId }) {
    const enrollment = await Enrollment.findOne({
      user: userId,
      "enrolledCourses.course": courseId,
    })
      .populate({
        path: "enrolledCourses.course",
        select: "-__v",
        populate: {
          path: "details",
          select: "-__v",
        },
      })
      .populate({
        path: "enrolledCourses.batch",
        select: "_id batchName startDate endDate status",
      })
      .populate({
        path: "enrolledCourses.paymentId",
        select: "status appUsed paymentMode paymentId amountInRupees createdAt",
      })
      .lean();

    if (!enrollment) {
      throw new ApiError(404, "Course enrollment not found");
    }

    const enrolledCourse = enrollment.enrolledCourses.find(
      (ec) => ec.course && ec.course._id.toString() === courseId
    );

    if (!enrolledCourse) {
      throw new ApiError(404, "Course not enrolled");
    }

    let liveClasses = [];
    if (enrolledCourse.batch) {
      liveClasses = await LiveClass.find({
        course: courseId,
        batch: enrolledCourse.batch._id,
      }).select("title startTime zoomJoinUrl status")
        .sort({ startTime: 1 })
        .lean();
    }

    return {
      courseId: enrolledCourse.course._id,
      course: enrolledCourse.course,
      batch: enrolledCourse.batch || null,
      payment: enrolledCourse.paymentId || null,
      completed: enrolledCourse.completed,
      enrolledAt: enrolledCourse.enrolledAt,
      liveClasses,
    };
  }

  static async getStudentEnrolledCourses({ userId, type }) {
    if (type === "ids") {
      const enrollment = await Enrollment.findOne(
        { user: userId },
        { "enrolledCourses.course": 1, _id: 0 }
      );

      const courseIds = enrollment?.enrolledCourses.map(item => item.course) || [];
      return { courseIds };
    }

    const enrollment = await Enrollment.findOne({ user: userId })
      .select("enrolledCourses")
      .populate({
        path: "enrolledCourses.course",
        select: "name duration category thumbnail shortdescription"
      })
      .populate({
        path: "enrolledCourses.batch",
        select: "batchName"
      })
      .lean();

    if (!enrollment) {
      return { summary: [], totalCourses: 0 };
    }

    const summary = enrollment.enrolledCourses.map(item => ({
      _id: item.course?._id,
      courseName: item.course?.name,
      shortDescription: item.course?.shortdescription,
      thumbnail: item.course?.thumbnail,
      duration: item.course?.duration,
      category: item.course?.category,
      batchName: item.batch?.batchName || null,
      enrolledAt: item.enrolledAt,
      completed: item.completed,
    }));

    return { summary, totalCourses: summary.length };
  }

  static async getUserEnrollments({ userId, requestedUserRole, requestUserId }) {
    let resolvedUserId = userId;

    if (requestedUserRole !== "admin" && requestedUserRole !== "superadmin") {
      resolvedUserId = requestUserId;
    }

    const user = await User.findById(resolvedUserId).select(
      "name email role mobile profileImage emailVerified"
    );

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const enrollments = await Enrollment.findOne({ user: resolvedUserId })
      .populate({
        path: "enrolledCourses.course",
        select: "name thumbnail price category shortdescription duration",
      })
      .populate({
        path: "enrolledCourses.batch",
        select: "batchName startDate endDate status",
      })
      .populate({
        path: "enrolledCourses.paymentId",
        select: "amountInRupees status paymentMethod createdAt",
      });

    return {
      user,
      enrolledCourses: enrollments?.enrolledCourses || [],
    };
  }

  // 2. Cart Management Business Logic
  static async getCartItems({ userId }) {
    const cart = await Cart.findOne({ userId })
      .populate('items.courseId', 'name price thumbnail');

    if (!cart) {
      return { items: [] };
    }

    const filteredItems = cart.items.map(item => ({
      _id: item.courseId?._id.toString(),
      name: item.courseId?.name,
      price: item.courseId?.price,
      thumbnail: item.courseId?.thumbnail
    }));

    return { _id: cart._id, items: filteredItems };
  }

  static async addItemToCart({ userId, courseId }) {
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [{ courseId }] });
    } else {
      const existing = cart.items.find(i => i.courseId?.toString() === courseId);
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.items.push({ courseId });
      }
    }
    await cart.save();
    return cart;
  }

  static async removeItemFromCart({ userId, courseId }) {
    const cart = await Cart.findOne({ userId });
    if (cart) {
      cart.items = cart.items.filter(i => i.courseId?.toString() !== courseId);
      await cart.save();
    }
    return cart;
  }

  static async deleteCart({ userId }) {
    const deleted = await Cart.findOneAndDelete({ userId });
    if (!deleted) {
      throw new ApiError(404, 'No cart found to delete');
    }
    return { cartId: deleted._id };
  }

  // 3. Admin Student Reports Business Logic
  static async getStudentsReport({ page = 1, limit = 10, search }) {
    let query = { role: 'student', emailVerified: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('_id name mobile email emailVerified');

    const total = await User.countDocuments(query);

    return {
      students,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    };
  }

  static async downloadStudentsReport({ startDate, endDate }) {
    let query = { role: 'student', emailVerified: true };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const students = await User.find(query).sort({ createdAt: -1 });

    if (students.length === 0) {
      throw new ApiError(404, 'No students found matching the criteria');
    }

    const workbook = new exceljs.Workbook();
    const dataSheet = workbook.addWorksheet('Students Data');

    dataSheet.columns = [
      { header: 'SR No.', key: 'serial', width: 8 },
      { header: 'Student ID', key: '_id', width: 25 },
      { header: 'Full Name', key: 'name', width: 25 },
      { header: 'Email Address', key: 'email', width: 30 },
      { header: 'Mobile Number', key: 'mobile', width: 15 },
      { header: 'Email Verified', key: 'emailVerified', width: 15 },
      { header: 'Account Created', key: 'createdAt', width: 20 },
      { header: 'Last Updated', key: 'updatedAt', width: 20 }
    ];

    students.forEach((student, index) => {
      dataSheet.addRow({
        serial: index + 1,
        _id: student._id.toString(),
        name: student.name || 'Not Provided',
        email: student.email,
        mobile: student.mobile || 'Not Provided',
        emailVerified: student.emailVerified ? 'Verified' : 'Pending',
        createdAt: student.createdAt.toLocaleDateString('en-IN'),
        updatedAt: student.updatedAt.toLocaleDateString('en-IN')
      });
    });

    const dataHeader = dataSheet.getRow(1);
    dataHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    dataHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2F5496' }
    };
    dataHeader.alignment = { vertical: 'middle', horizontal: 'center' };

    const summarySheet = workbook.addWorksheet('Summary');

    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 }
    ];

    const totalStudents = students.length;
    const verifiedStudents = students.filter(s => s.emailVerified).length;
    const studentsWithMobile = students.filter(s => s.mobile).length;
    const studentsWithName = students.filter(s => s.name).length;

    summarySheet.addRow({ metric: 'Total Students', value: totalStudents });
    summarySheet.addRow({ metric: 'Email Verified', value: verifiedStudents });
    summarySheet.addRow({ metric: 'With Mobile Number', value: studentsWithMobile });
    summarySheet.addRow({ metric: 'With Name Provided', value: studentsWithName });
    summarySheet.addRow({ metric: 'Verification Rate', value: `${((verifiedStudents / totalStudents) * 100).toFixed(1)}%` });
    summarySheet.addRow({ metric: 'Report Generated', value: new Date().toLocaleString() });

    const summaryHeader = summarySheet.getRow(1);
    summaryHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summaryHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' }
    };

    return workbook;
  }
}

export default StudentsService;
