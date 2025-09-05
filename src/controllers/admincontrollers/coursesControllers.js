import Course from '../../models/courses.js';
import CourseAudit from '../../models/courseAudit.js';
import { generateUpdatePayload } from '../../utils/generatepayload.js';


export const getCourses = async (req, res) => {
  console.log("GET COURSES")
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching courses', error });
  }
};
export const addCourse = async (req, res) => {
  try {
    const { name, description, instructor, duration,price,category } = req.body;

    const newCourse = new Course({
      name,
      description,
      instructor,
      duration,
      category,
      price
    });

    await newCourse.save();
    res.status(201).json({ message: 'Course added', data: newCourse });
  } catch (error) {
    res.status(400).json({ message: 'Error adding course', error });
  }
};

export const updateCourse = async (req, res) => {
  console.log("iam here ")
  try {
    const { _id } = req.params;
    const incoming = req.body;

    const existingCourse = await Course.findById(_id);
    if (!existingCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const fields = ['name', 'description', 'instructor', 'duration', 'price','category'];
    const { payload, changes } = generateUpdatePayload(existingCourse, incoming, fields);

    if (Object.keys(payload).length === 0) {
      return res.status(200).json({
        message: 'No changes detected',
        data: existingCourse
      });
    }

    const updatedCourse = await Course.findByIdAndUpdate(_id, payload, { new: true });

    await CourseAudit.create({
      courseId: _id,
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

// controllers/courseController.js
export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCourse = await Course.findByIdAndDelete(id);

    if (!deletedCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.status(200).json({ message: 'Course deleted successfully', data: deletedCourse });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting course', error });
  }
};