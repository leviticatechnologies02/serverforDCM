import Course from '../../../models/courses.js';
import CourseAudit from '../../../models/courseAudit.js';
import CourseDetails from '../../../models/courseDetails.js';
import ApiError from '../../../utils/ApiError.js';
import { generateUpdatePayload } from '../../../utils/generatepayload.js';
import { courseCategories } from '../../../config/courseCategories.js';

export class CoursesService {
  static async getCourses() {
    const courses = await Course.find().sort({ createdAt: -1 });
    return courses;
  }

  static async getFreeCourses() {
    const freeCourses = await Course.find({ price: 0 })
      .select("_id name price thumbnail ")
      .lean();
    return freeCourses;
  }

  static async addCourse({ name, duration, price, category, thumbnail, shortdescription }) {
    const newCourse = new Course({
      name,
      duration,
      category,
      shortdescription,
      thumbnail,
      price
    });

    await newCourse.save();
    return newCourse;
  }

  static async updateCourse({ id, incoming, user }) {
    const existingCourse = await Course.findById(id);
    if (!existingCourse) {
      throw new ApiError(404, 'Course not found');
    }

    const fields = ['name', 'shortdescription', 'instructor', 'duration', 'price', 'category'];
    const { payload, changes } = generateUpdatePayload(existingCourse, incoming, fields);

    if (Object.keys(payload).length === 0) {
      return {
        message: 'No changes detected',
        data: existingCourse
      };
    }

    const updatedCourse = await Course.findByIdAndUpdate(id, payload, { new: true });

    await CourseAudit.create({
      courseId: id,
      updatedBy: user?.id || null,
      changes,
      context: 'manual update'
    });

    return {
      message: 'Course updated successfully',
      data: updatedCourse,
      changes
    };
  }

  static async deleteCourse(id) {
    const course = await Course.findById(id);
    if (!course) {
      throw new ApiError(404, "Course not found");
    }

    if (course.details) {
      await CourseDetails.findByIdAndDelete(course.details);
    }

    await Course.findByIdAndDelete(id);
    return { message: "Course and related details deleted successfully" };
  }

  static async getCourseById(id) {
    const course = await Course.findById(id).populate('details');
    if (!course) {
      throw new ApiError(404, 'Course not found');
    }
    return course;
  }

  static async addCourseDetails({ courseId, description, objectives, requirements, curriculum }) {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new ApiError(404, 'Course not found');
    }

    const existingDetails = await CourseDetails.findOne({ course: courseId });
    if (existingDetails) {
      throw new ApiError(400, 'Course details already exist');
    }

    const details = await CourseDetails.create({
      course: courseId,
      description,
      objectives,
      requirements,
      curriculum
    });

    course.details = details._id;
    await course.save();

    return details;
  }

  static async updateCourseDetails({ courseId, updateData }) {
    const details = await CourseDetails.findOneAndUpdate(
      { course: courseId },
      updateData,
      { new: true }
    );

    if (!details) {
      throw new ApiError(404, "Course details not found");
    }

    return details;
  }

  static async updateCurriculum({ courseId, curriculum }) {
    const updated = await CourseDetails.findOneAndUpdate(
      { course: courseId },
      { curriculum },
      { new: true }
    );

    if (!updated) {
      throw new ApiError(404, "Course details not found");
    }

    return updated.curriculum;
  }

  static async getCourseCategories() {
    return courseCategories;
  }
}

export default CoursesService;
