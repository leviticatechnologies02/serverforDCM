
import express from 'express';
import { getCourses, addCourse, deleteCourse, updateCourse } from '../../controllers/admincontrollers/coursesControllers.js';
import  verifyToken from '../../middlewares/authMiddleware.js';
import { verifyAdmin } from '../../middlewares/verifyadminMiddleware.js';

const courseRouter = express.Router();

courseRouter.get('/getcourses', verifyToken,  getCourses);
courseRouter.post('/add-course', verifyToken, verifyAdmin, addCourse);
courseRouter.put('/update-course/:_id',verifyToken,verifyAdmin,updateCourse)
courseRouter.delete('/delete-course/:id', verifyToken, verifyAdmin, deleteCourse);
 
export default courseRouter
