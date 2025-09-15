// routes/categoryRoutes.js
import express from 'express';
import { getCourseCategories } from '../../controllers/admincontrollers/coursesCategoriesControllers.js';

const categoriesRouter = express.Router();

categoriesRouter.get('/categories', getCourseCategories);

export default categoriesRouter;    