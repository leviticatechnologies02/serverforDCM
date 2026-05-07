import express from 'express';
import { verifyToken } from '../../../middlewares/auth.middleware.js';
import {
  getCartItems,
  addItemToCart,
  removeItemFromCart,
  deleteCart
} from '../controller/students.controller.js';

const cartRouter = express.Router();

// Require auth for cart operations
cartRouter.use(verifyToken);

// Cart endpoints matching legacy paths
cartRouter.get('/:userId', getCartItems);
cartRouter.post('/add', addItemToCart);
cartRouter.post('/remove', removeItemFromCart);
cartRouter.delete('/clear/:userId', deleteCart);

export default cartRouter;
