import { usersRouter, usersAdminRouter } from './routes/users.routes.js';
import UsersService from './service/users.service.js';
import * as usersController from './controller/users.controller.js';

export {
  usersRouter,
  usersAdminRouter,
  UsersService,
  usersController
};

export default usersRouter;
