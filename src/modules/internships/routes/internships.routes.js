import express from 'express';
import { verifyToken, verifyAdmin } from '../../../middlewares/auth.middleware.js';
import {
  createInternshipsDomain,
  getAllInternshipsDomains,
  getInternshipsDomainById,
  updateInternshipsDomain,
  deleteInternshipsDomain,
  createOrder,
  verifyPayment,
  getPayment
} from '../controller/internships.controller.js';

const internshipsRouter = express.Router();
const internshipsAdminRouter = express.Router();

// 1. Student / Public Internships Routes (mounted on /internship)
internshipsRouter.get('/', getAllInternshipsDomains);
internshipsRouter.post('/payments/create-order', createOrder);
internshipsRouter.post('/payments/verify-payment', verifyPayment);
internshipsRouter.get('/payments/:orderId', getPayment);

// 2. Admin Internships Domain Routes (mounted on /admin/internshipsdomain)
internshipsAdminRouter.use(verifyToken, verifyAdmin);
internshipsAdminRouter.post('/', createInternshipsDomain);
internshipsAdminRouter.get('/:id', getInternshipsDomainById);
internshipsAdminRouter.put('/:id', updateInternshipsDomain);
internshipsAdminRouter.delete('/:id', deleteInternshipsDomain);

export {
  internshipsRouter,
  internshipsAdminRouter
};

export default internshipsRouter;
