import { Router, type IRouter } from "express";
import healthRouter from "./health";
import previewsRouter from "./previews";

const router: IRouter = Router();

router.use(healthRouter);
router.use(previewsRouter);

export default router;
