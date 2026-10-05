import { Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess, sendError } from "../utils/response";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

export async function getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    const whereClause: any = req.user.role === "ADMIN"
      ? { forRole: "ADMIN" }
      : { forRole: "USER", userId: req.user.userId };

    const notifications = await prisma.appNotification.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    sendSuccess(res, notifications);
  } catch (err: any) {
    sendError(res, err.message || "Failed to fetch notifications", 500);
  }
}

export async function markRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const notification = await prisma.appNotification.update({
      where: { id },
      data: { read: true },
    });

    sendSuccess(res, notification, "Notification marked as read");
  } catch (err: any) {
    sendError(res, err.message || "Failed to update notification", 500);
  }
}

export async function markAllRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    const whereClause: any = req.user.role === "ADMIN"
      ? { forRole: "ADMIN" }
      : { forRole: "USER", userId: req.user.userId };

    await prisma.appNotification.updateMany({
      where: whereClause,
      data: { read: true },
    });

    sendSuccess(res, null, "All notifications marked as read");
  } catch (err: any) {
    sendError(res, err.message || "Failed to clear notifications", 500);
  }
}
