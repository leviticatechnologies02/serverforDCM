import express from 'express';
import { AddItemToCart, DeleteCart, GetCartItems, RemoveItem } from '../../controllers/studentcontrollers/cartControllers.js';




const cartRouter = express.Router();
cartRouter.get('/:userId', GetCartItems)
cartRouter.post('/add', AddItemToCart)
cartRouter.post('/remove', RemoveItem)
cartRouter.delete('/clear/:userId', DeleteCart)
export default cartRouter
