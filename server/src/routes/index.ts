import { Router } from "express";
import { authRouter } from "./auth.js";
import { shiftsRouter } from "./shifts.js";
import { tasksRouter } from "./tasks.js";
import { contributorsRouter } from "./contributors.js";
import { adminRouter } from "./admin.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/shifts", shiftsRouter);
apiRouter.use("/tasks", tasksRouter);
apiRouter.use("/contributors", contributorsRouter);
apiRouter.use("/admin", adminRouter);
