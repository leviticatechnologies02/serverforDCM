// controllers/categoryController.js
import { courseCategories } from '../../config/courseCategories.js ';

export const getCourseCategories = (req, res) => {
  res.status(200).json( courseCategories);
};  