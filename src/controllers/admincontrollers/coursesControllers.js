import Course from '../../models/courses.js';
import CourseAudit from '../../models/courseAudit.js';
import CourseDetails from '../../models/courseDetails.js';
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
    const { name, duration,price,category,thumbnail } = req.body;

    const newCourse = new Course({
      name, 
      duration,
      category,
      thumbnail,
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
