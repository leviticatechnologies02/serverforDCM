import authRouter from './routes/auth.routes.js';
import AuthService from './service/auth.service.js';
import * as authController from './controller/auth.controller.js';
import * as authValidation from './validation/auth.validation.js';

export {
  authRouter,
  AuthService,
  authController,
  authValidation
};

export default authRouter;
