import paymentsRouter from './routes/payments.routes.js';
import PaymentsService from './service/payments.service.js';
import * as paymentsController from './controller/payments.controller.js';

export {
  paymentsRouter,
  PaymentsService,
  paymentsController
};

export default paymentsRouter;
