import express from 'express';
import { verifyToken, verifyAdmin } from '../../../middlewares/auth.middleware.js';
import {
  getPromos,
  createPromo,
  updatePromo,
  deletePromo,
  togglePromo,
  applyPromo
} from '../controller/promocodes.controller.js';

const promocodesRouter = express.Router();
const promocodesAdminRouter = express.Router();

// 1. Student / Public Applied Promo calculations (mounted on /api/promo)
promocodesRouter.post('/apply', verifyToken, applyPromo);

// 2. Admin Promotional code management (mounted on /admin/promocode)
promocodesAdminRouter.use(verifyToken, verifyAdmin);
promocodesAdminRouter.get('/', getPromos);
promocodesAdminRouter.post('/', createPromo);
promocodesAdminRouter.patch('/:id', updatePromo);
promocodesAdminRouter.delete('/:id', deletePromo);
promocodesAdminRouter.patch('/toggle/:id', togglePromo);

export {
  promocodesRouter,
  promocodesAdminRouter
};

export default promocodesRouter;
