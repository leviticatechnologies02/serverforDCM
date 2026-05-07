import { internshipsRouter, internshipsAdminRouter } from './routes/internships.routes.js';
import InternshipsService from './service/internships.service.js';
import * as internshipsController from './controller/internships.controller.js';

export {
  internshipsRouter,
  internshipsAdminRouter,
  InternshipsService,
  internshipsController
};

export default internshipsRouter;
