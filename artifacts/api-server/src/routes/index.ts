import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tradesRouter from "./trades";
import storageRouter from "./storage";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(tradesRouter);
router.use(storageRouter);
router.use(authRouter);

export default router;
