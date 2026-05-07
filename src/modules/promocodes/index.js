import { promocodesRouter, promocodesAdminRouter } from './routes/promocodes.routes.js';
import PromocodesService from './service/promocodes.service.js';
import * as promocodesController from './controller/promocodes.controller.js';

export {
  promocodesRouter,
  promocodesAdminRouter,
  PromocodesService,
  promocodesController
};

export default promocodesRouter;
