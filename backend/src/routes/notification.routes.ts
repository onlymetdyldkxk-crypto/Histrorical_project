import { Router } from "express";
import { getNotifications, markRead, markAllRead } from "../controllers/notification.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/", getNotifications);
router.patch("/:id/read", markRead);
router.post("/mark-all-read", markAllRead);

export default router;
