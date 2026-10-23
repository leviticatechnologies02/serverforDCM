import express from 'express';
import { getProducts, getProductBySlug } from '../controllers/productController.js';
import { submitContactForm } from '../controllers/admincontrollers/contactUsMail.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/:slug', getProductBySlug);
router.post('/enquiry', submitContactForm);
router.post('/:slug/enquiry', (req, res, next) => {
  if (!req.body.productSlug && !req.body.details?.productSlug) {
    req.body.productSlug = req.params.slug;
  }
  return submitContactForm(req, res, next);
});

export default router;
