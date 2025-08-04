// controllers/courseController.js
import Course from "../../models/courses.js";

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
    const { name, description, instructor, duration } = req.body;

    const newCourse = new Course({
      name,
      description,
      instructor,
      duration
    });

    await newCourse.save();
    res.status(201).json({ message: 'Course added', data: newCourse });
  } catch (error) {
    res.status(400).json({ message: 'Error adding course', error });
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