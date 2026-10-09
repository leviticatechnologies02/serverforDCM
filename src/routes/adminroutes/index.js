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
import downloadRouter from "../downloadRoute.js";
import createAdminRouter from "./createAdminRoutes.js";
import promoRouter from "./ promoRoutes.js";
import mentorRouter from "./mentorRoutes.js";
import enquiryRouter from "./enquiryRoutes.js";

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
adminRouter.use('/download',downloadRouter)
adminRouter.use("/student-reports", studentReportsRouter);
adminRouter.use("/user", createUserRouter);
adminRouter.use("/internshipsdomain", internshipsDomainRouter);
adminRouter.use("/admins",  createAdminRouter);
adminRouter.use("/promocode",promoRouter);
adminRouter.use("/mentors", mentorRouter);
adminRouter.use("/enquiries", enquiryRouter);

export default adminRouter;
