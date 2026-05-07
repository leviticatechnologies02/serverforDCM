import studentsRouter, { studentReportsAdminRouter } from './routes/students.routes.js';
import cartRouter from './routes/cart.routes.js';
import StudentsService from './service/students.service.js';
import * as studentsController from './controller/students.controller.js';

export {
  studentsRouter,
  studentReportsAdminRouter,
  cartRouter,
  StudentsService,
  studentsController
};

export default studentsRouter;
