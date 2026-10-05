import { Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess, sendError } from "../utils/response";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { SendQuoteInput, RejectRequestInput, AdminNoteInput, CompleteRequestInput } from "../schemas/admin.schema";
import { Role } from "@prisma/client";

export async function getOverview(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const [total, underReview, quoteAvailable, paymentReceived, processing, completed, rejected] = await Promise.all([
      prisma.docRequest.count(),
      prisma.docRequest.count({ where: { status: "UNDER_REVIEW" } }),
      prisma.docRequest.count({ where: { status: "QUOTE_AVAILABLE" } }),
      prisma.docRequest.count({ where: { status: "PAYMENT_RECEIVED" } }),
      prisma.docRequest.count({ where: { status: "PROCESSING" } }),
      prisma.docRequest.count({ where: { status: "COMPLETED" } }),
      prisma.docRequest.count({ where: { status: "REJECTED" } }),
    ]);

    sendSuccess(res, {
      total,
      underReview,
      quoteAvailable,
      paymentReceived,
      processing,
      completed,
      rejected,
    });
  } catch (err: any) {
    sendError(res, err.message || "Failed to fetch admin overview metrics", 500);
  }
}

export async function getAllRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { q, status, sort = "desc" } = req.query as { q?: string; status?: string; sort?: "asc" | "desc" };

    const whereClause: any = {};
    if (status && status !== "all") {
      whereClause.status = status.toUpperCase();
    }

    if (q) {
      whereClause.OR = [
        { id: { contains: q, mode: "insensitive" } },
        { requirements: { fullName: { contains: q, mode: "insensitive" } } },
        { requirements: { email: { contains: q, mode: "insensitive" } } },
        { document: { fileName: { contains: q, mode: "insensitive" } } },
      ];
    }

    const requests = await prisma.docRequest.findMany({
      where: whereClause,
      include: {
        document: true,
        requirements: true,
        quote: true,
        payment: true,
        rejection: true,
        completion: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { submittedAt: sort },
    });

    sendSuccess(res, requests);
  } catch (err: any) {
    sendError(res, err.message || "Failed to fetch administrative request list", 500);
  }
}

export async function getAdminRequestById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const docReq = await prisma.docRequest.findUnique({
      where: { id },
      include: {
        document: true,
        requirements: true,
        quote: true,
        payment: true,
        rejection: true,
        completion: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    if (!docReq) {
      sendError(res, "Request not found", 404);
      return;
    }

    sendSuccess(res, docReq);
  } catch (err: any) {
    sendError(res, err.message || "Failed to fetch admin request detail", 500);
  }
}

export async function saveAdminNote(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const { note }: AdminNoteInput = req.body;

    const docReq = await prisma.docRequest.update({
      where: { id },
      data: { adminNote: note },
    });

    sendSuccess(res, docReq, "Admin working note saved");
  } catch (err: any) {
    sendError(res, err.message || "Failed to save admin note", 500);
  }
}

export async function sendQuote(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const { charge, estimatedDays, expectedDate, adminMessage, extraInstructions }: SendQuoteInput = req.body;

    const docReq = await prisma.docRequest.findUnique({ where: { id } });
    if (!docReq) {
      sendError(res, "Request not found", 404);
      return;
    }

    const [updatedReq, quote] = await prisma.$transaction([
      prisma.docRequest.update({
        where: { id },
        data: { status: "QUOTE_AVAILABLE" },
      }),
      prisma.quote.upsert({
        where: { requestId: id },
        create: {
          requestId: id,
          charge,
          estimatedDays,
          expectedDate: new Date(expectedDate),
          adminMessage,
          extraInstructions,
        },
        update: {
          charge,
          estimatedDays,
          expectedDate: new Date(expectedDate),
          adminMessage,
          extraInstructions,
          sentAt: new Date(),
        },
      }),
    ]);

    await prisma.appNotification.create({
      data: {
        forRole: Role.USER,
        userId: docReq.userId,
        requestId: docReq.id,
        title: "Your quotation is ready.",
        body: `The quote for request ${docReq.id} is ready. Review details and approve payment to proceed.`,
        tone: "SUCCESS",
      },
    });

    sendSuccess(res, { request: updatedReq, quote }, "Quotation sent to user successfully");
  } catch (err: any) {
    sendError(res, err.message || "Failed to send quotation", 500);
  }
}

export async function rejectRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const { reason, message }: RejectRequestInput = req.body;

    const docReq = await prisma.docRequest.findUnique({ where: { id } });
    if (!docReq) {
      sendError(res, "Request not found", 404);
      return;
    }

    const [updatedReq, rejection] = await prisma.$transaction([
      prisma.docRequest.update({
        where: { id },
        data: { status: "REJECTED" },
      }),
      prisma.rejectionInfo.upsert({
        where: { requestId: id },
        create: {
          requestId: id,
          reason,
          message,
        },
        update: {
          reason,
          message,
          rejectedAt: new Date(),
        },
      }),
    ]);

    await prisma.appNotification.create({
      data: {
        forRole: Role.USER,
        userId: docReq.userId,
        requestId: docReq.id,
        title: "Request status update.",
        body: `Your request ${docReq.id} could not be fulfilled: ${reason}.`,
        tone: "DANGER",
      },
    });

    sendSuccess(res, { request: updatedReq, rejection }, "Request rejected successfully");
  } catch (err: any) {
    sendError(res, err.message || "Failed to reject request", 500);
  }
}

export async function startProcessing(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const docReq = await prisma.docRequest.findUnique({ where: { id } });
    if (!docReq) {
      sendError(res, "Request not found", 404);
      return;
    }

    const updatedReq = await prisma.docRequest.update({
      where: { id },
      data: { status: "PROCESSING" },
    });

    await prisma.appNotification.create({
      data: {
        forRole: Role.USER,
        userId: docReq.userId,
        requestId: docReq.id,
        title: "Document processing started.",
        body: `Our specialists have started transcribing and processing request ${docReq.id}.`,
        tone: "INFO",
      },
    });

    sendSuccess(res, updatedReq, "Processing started");
  } catch (err: any) {
    sendError(res, err.message || "Failed to start processing", 500);
  }
}

export async function completeRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const { fileName, fileLabel, note, message, storageKey }: CompleteRequestInput = req.body;

    const docReq = await prisma.docRequest.findUnique({ where: { id } });
    if (!docReq) {
      sendError(res, "Request not found", 404);
      return;
    }

    const [updatedReq, completion] = await prisma.$transaction([
      prisma.docRequest.update({
        where: { id },
        data: { status: "COMPLETED" },
      }),
      prisma.completionInfo.upsert({
        where: { requestId: id },
        create: {
          requestId: id,
          fileName,
          fileLabel,
          note,
          message,
          storageKey,
        },
        update: {
          fileName,
          fileLabel,
          note,
          message,
          storageKey,
          completedAt: new Date(),
        },
      }),
    ]);

    await prisma.appNotification.create({
      data: {
        forRole: Role.USER,
        userId: docReq.userId,
        requestId: docReq.id,
        title: "Conversion completed!",
        body: `Your historical document conversion ${docReq.id} is complete and ready for download.`,
        tone: "SUCCESS",
      },
    });

    sendSuccess(res, { request: updatedReq, completion }, "Request marked as completed successfully");
  } catch (err: any) {
    sendError(res, err.message || "Failed to mark request as completed", 500);
  }
}
