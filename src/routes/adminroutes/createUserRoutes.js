
import express from 'express';
import { createUser } from '../../controllers/admincontrollers/createUserControllers.js';

const createUserRouter = express.Router();


createUserRouter.post('/create-user', createUser);
 
export default createUserRouter