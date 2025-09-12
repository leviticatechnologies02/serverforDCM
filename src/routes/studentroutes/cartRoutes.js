import express from 'express';
import { AddItemToCart, GetCartItems, RemoveItem } from '../../controllers/studentcontrollers/cartControllers.js';

import verifyToken from '../../middlewares/authMiddleware.js';


const cartRouter = express.Router();
cartRouter.get('/:userId', verifyToken,GetCartItems)
cartRouter.post('/add', verifyToken,AddItemToCart)
cartRouter.post('/remove', verifyToken,RemoveItem)
export default cartRouter
