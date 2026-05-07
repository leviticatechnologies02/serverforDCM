import express from 'express';
import { verifyToken, verifyAdmin, verifySuperAdmin } from '../../../middlewares/auth.middleware.js';
import {
  createMentor,
  getMentors,
  updateMentor,
  deleteMentor
} from '../controller/mentors.controller.js';

const mentorsRouter = express.Router();

// Require valid authentication and administrative rights
mentorsRouter.use(verifyToken, verifyAdmin);

mentorsRouter.get('/', getMentors);

// Specific mutate endpoints require superadmin permissions as configured in legacy routes
mentorsRouter.post('/', verifySuperAdmin, createMentor);
mentorsRouter.put('/:id', verifySuperAdmin, updateMentor);
mentorsRouter.delete('/:id', verifySuperAdmin, deleteMentor);

export default mentorsRouter;
