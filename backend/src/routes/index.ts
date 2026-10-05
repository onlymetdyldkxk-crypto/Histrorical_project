import { Router } from "express";
import authRouter from "./auth.routes";
import requestRouter from "./request.routes";
import adminRouter from "./admin.routes";
import paymentRouter from "./payment.routes";
import fileRouter from "./file.routes";
import notificationRouter from "./notification.routes";

const apiV1 = Router();

apiV1.use("/auth", authRouter);
apiV1.use("/requests", requestRouter);
apiV1.use("/admin", adminRouter);
apiV1.use("/payments", paymentRouter);
apiV1.use("/files", fileRouter);
apiV1.use("/notifications", notificationRouter);

// API Health Check
apiV1.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Historical Document Conversion API is running",
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "Historical Document Conversion API",
    version: "v1",
  });
});

export default apiV1;
