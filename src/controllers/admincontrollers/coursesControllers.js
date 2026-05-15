import Course from '../../models/courses.js';
import CourseAudit from '../../models/courseAudit.js';
import CourseDetails from '../../models/courseDetails.js';
import { generateUpdatePayload } from '../../utils/generatepayload.js';
import mongoose from 'mongoose';


export const getCourses = async (req, res) => {
  console.log("GET COURSES")
  try {
    const courses = await Course.find().sort({ createdAt: -1 });

    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching courses', error });
  }
};

export const getFreeCourses = async (req, res) => {
  console.log("🔥 getFreeCourses controller HIT");
  try {
    const freeCourses = await Course.find({ price: 0 })
      .select("_id name price thumbnail ")
      .lean();
    console.log(freeCourses, 'iam')
    return res.status(200).json({
      success: true,
      count: freeCourses.length,
      data: freeCourses,
    });

  } catch (error) {
    console.error("Get Free Courses Error:");
    console.error(error);
    console.error(error.message);
    console.error(error.stack);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }


};


export const addCourse = async (req, res) => {
  try {
    const { name, duration, price, category, thumbnail, shortdescription } = req.body;

    // 🚀 Auto-generate MongoDB ID so we can create the Google Product ID convention
    const courseId = new mongoose.Types.ObjectId();
    const googleProductId = `course_${courseId}`;

    const newCourse = new Course({
      _id: courseId,
      name,
      duration,
      category,
      shortdescription,
      thumbnail,
      price,
      googleProductId // Automatically assigned
    });

    await newCourse.save();
    res.status(201).json({
      message: 'Course added successfully',
      data: newCourse,
      instruction: "Copy this Google Product ID for your Play Console: " + googleProductId
    });
  } catch (error) {
    console.error("Add Course Error:", error);
    res.status(400).json({ message: 'Error adding course', error: error.message });
  }
};

export const updateCourse = async (req, res) => {
  console.log("iam here ")
  try {
    const { id } = req.params;
    const incoming = req.body;

    const existingCourse = await Course.findById(id);
    if (!existingCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const fields = ['name', 'shortdescription', 'duration', 'price', 'category', 'thumbnail'];
    const { payload, changes } = generateUpdatePayload(existingCourse, incoming, fields);

    if (Object.keys(payload).length === 0) {
      return res.status(200).json({
        message: 'No changes detected',
        data: existingCourse
      });
    }

    const updatedCourse = await Course.findByIdAndUpdate(id, payload, { new: true });

    await CourseAudit.create({
      courseId: id,
      updatedBy: req.user?.id || null,
      changes,
      context: 'manual update'
    });

    res.status(200).json({
      message: 'Course updated successfully',
      data: updatedCourse,
      changes
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: 'Error updating course', error });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    // 🔥 CASCADE DELETE
    if (course.details) {
      await CourseDetails.findByIdAndDelete(course.details);
    }

    await Course.findByIdAndDelete(id);

    res.status(200).json({
      message: "Course and related details deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting course",
      error: error.message,
    });
  }
};


export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('details');

    if (!course) {
      return res.status(404).json({
        message: 'Course not found'
      });
    }

    res.status(200).json({
      data: course
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching course',
      error: error.message
    });
  }
};

export const addCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { description, objectives, requirements, curriculum } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const existingDetails = await CourseDetails.findOne({ course: courseId });
    if (existingDetails) {
      return res.status(400).json({
        message: 'Course details already exist'
      });
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

    res.status(201).json({
      message: 'Course details added successfully',
      data: details
    });
  } catch (error) {
    res.status(400).json({
      message: 'Error adding course details',
      error: error.message
    });
  }
};

// PUT /courses/:courseId/details
export const updateCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params;

    const details = await CourseDetails.findOneAndUpdate(
      { course: courseId },
      req.body,
      { new: true }
    );

    if (!details) {
      return res.status(404).json({
        message: "Course details not found"
      });
    }

    res.status(200).json({
      message: "Course details updated",
      data: details
    });
  } catch (error) {
    res.status(400).json({
      message: "Error updating course details",
      error: error.message
    });
  }
};


export const updateCurriculum = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { curriculum } = req.body;

    const updated = await CourseDetails.findOneAndUpdate(
      { course: courseId },
      { curriculum },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Course details not found",
      });
    }

    res.status(200).json({
      message: "Curriculum updated",
      data: updated.curriculum,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to update curriculum",
      error: error.message,
    });
  }
};
