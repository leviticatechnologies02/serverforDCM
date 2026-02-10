import { Router } from "express";
import verifyToken from "../../middlewares/authMiddleware.js";
import { verifyAdmin } from "../../middlewares/verifyMiddleware.js";

import courseRouter from "./coursesRoutes.js";
import batchRouter from "./batchDetailsRoutes.js";
import assignRouter from "./assignRoutes.js";
import transactionRouter from "./transactionRoutes.js";
import liveClassRouter from "./liveClassesRoutes.js";
import statsRouter from "./statsRoutes.js";
import createUserRouter from "./createUserRoutes.js";
import internshipsDomainRouter from "./internshipsRoutes.js";
import studentReportsRouter from "./studentReportsRoutes.js";

const adminRouter = Router();


adminRouter.use(verifyToken, verifyAdmin);


adminRouter.use((req, res, next) => {
  console.log("Admin:", req.user.email);
  next();
});

//  sub-routers
adminRouter.use("/courses", courseRouter);
adminRouter.use("/batchs", batchRouter);
adminRouter.use("/enroll", assignRouter);
adminRouter.use("/transactions", transactionRouter);
adminRouter.use("/zoom", liveClassRouter);
adminRouter.use("/stats", statsRouter);
adminRouter.use("/student-reports", studentReportsRouter);
adminRouter.use("/user", createUserRouter);
adminRouter.use("/internshipsdomain", internshipsDomainRouter);

export default adminRouter;
