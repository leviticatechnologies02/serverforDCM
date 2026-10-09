import { Router } from 'express';
import { getEnquiries, deleteEnquiry } from '../../controllers/admincontrollers/enquiryController.js';

const router = Router();

router.get('/', getEnquiries);
router.delete('/:id', deleteEnquiry);

export default router;
