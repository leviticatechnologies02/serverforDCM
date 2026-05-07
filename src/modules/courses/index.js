import coursesRouter, { coursesAdminRouter } from './routes/courses.routes.js';
import CoursesService from './service/courses.service.js';
import * as coursesController from './controller/courses.controller.js';

export {
  coursesRouter,
  coursesAdminRouter,
  CoursesService,
  coursesController
};

export default coursesRouter;
