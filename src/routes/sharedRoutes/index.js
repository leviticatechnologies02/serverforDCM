import { Router } from "express";
import verifyToken from "../../middlewares/authMiddleware.js";
import coursesRoutes from "./courses.routes.js";
import paymentRouter from "../paymentRoutes/paymentRoutes.js";

const sharedRouter = Router();

sharedRouter.use(verifyToken);
sharedRouter.use("/courses", coursesRoutes);
sharedRouter.use('/payments',paymentRouter)

export default sharedRouter;
