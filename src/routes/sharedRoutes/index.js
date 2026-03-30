import { Router } from "express";
import verifyToken from "../../middlewares/authMiddleware.js";
import coursesRoutes from "./courses.routes.js";
import paymentRouter from "../paymentRoutes/paymentRoutes.js";
import cartRouter from "../studentroutes/cartRoutes.js";
import noticeRouter from "../adminroutes/noticeRoutes.js";
import promoRouter from "../studentroutes/promocodeRoutes.js";

const sharedRouter = Router();

sharedRouter.use(verifyToken);
sharedRouter.use("/courses", coursesRoutes);
sharedRouter.use('/payments',paymentRouter)
sharedRouter.use('/cart',cartRouter)
sharedRouter.use('/notices',noticeRouter)
sharedRouter.use("/promo", promoRouter)


export default sharedRouter;
