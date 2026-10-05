import { Response } from "express";
import { prisma } from "../config/database";
import { sendSuccess, sendError } from "../utils/response";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { CreateRequestInput } from "../schemas/request.schema";
import { Role } from "@prisma/client";

function generateRequestId(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `REQ-${num}`;
}

export async function createRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    const { document, requirements }: CreateRequestInput = req.body;
    let requestId = generateRequestId();

    // Ensure uniqueness of request ID
    let exists = await prisma.docRequest.findUnique({ where: { id: requestId } });
    while (exists) {
      requestId = generateRequestId();
      exists = await prisma.docRequest.findUnique({ where: { id: requestId } });
    }

    const newRequest = await prisma.docRequest.create({
      data: {
        id: requestId,
        userId: req.user.userId,
        status: "UNDER_REVIEW",
        document: {
          create: {
            kind: document.kind,
            fileName: document.fileName,
            fileType: document.fileType,
            fileSize: document.fileSize,
            fileCount: document.fileCount,
            driveUrl: document.driveUrl,
            storageKey: document.storageKey,
          },
        },
        requirements: {
          create: {
            fullName: requirements.fullName,
            age: requirements.age,
            gender: requirements.gender,
            email: requirements.email,
            phone: requirements.phone,
            address: requirements.address,
            purpose: requirements.purpose,
            processing: requirements.processing,
            outputFormat: requirements.outputFormat,
            instructions: requirements.instructions,
            notes: requirements.notes,
          },
        },
      },
      include: {
        document: true,
        requirements: true,
      },
    });

    // Create user notification
    await prisma.appNotification.create({
      data: {
        forRole: Role.USER,
        userId: req.user.userId,
        requestId: newRequest.id,
        title: "Your request has been received.",
        body: `Request ${newRequest.id} (${document.fileName}) is now under review by our archivist team.`,
        tone: "INFO",
      },
    });

    // Create admin notification
    await prisma.appNotification.create({
      data: {
        forRole: Role.ADMIN,
        requestId: newRequest.id,
        title: "New request submitted.",
        body: `${requirements.fullName} submitted request ${newRequest.id} — ${document.fileName}.`,
        tone: "INFO",
      },
    });

    sendSuccess(res, newRequest, "Document conversion request submitted successfully", 201);
  } catch (err: any) {
    sendError(res, err.message || "Failed to submit request", 500);
  }
}

export async function getUserRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    const requests = await prisma.docRequest.findMany({
      where: { userId: req.user.userId },
      include: {
        document: true,
        requirements: true,
        quote: true,
        payment: true,
        rejection: true,
        completion: true,
      },
      orderBy: { submittedAt: "desc" },
    });

    sendSuccess(res, requests);
  } catch (err: any) {
    sendError(res, err.message || "Failed to fetch user requests", 500);
  }
}

export async function getRequestById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, "Unauthorized", 401);
      return;
    }

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
      sendError(res, "Document request not found", 404);
      return;
    }

    // Access control: User can only see their own request, Admin can see any
    if (req.user.role !== "ADMIN" && docReq.userId !== req.user.userId) {
      sendError(res, "Access denied", 403);
      return;
    }

    sendSuccess(res, docReq);
  } catch (err: any) {
    sendError(res, err.message || "Failed to fetch request detail", 500);
  }
}

export async function getQuoteByRequestId(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    const id = req.params.id as string;
    const quote = await prisma.quote.findUnique({
      where: { requestId: id },
      include: { request: true },
    });

    if (!quote) {
      sendError(res, "Quotation not found for this request", 404);
      return;
    }

    if (req.user.role !== "ADMIN" && quote.request.userId !== req.user.userId) {
      sendError(res, "Access denied", 403);
      return;
    }

    sendSuccess(res, quote);
  } catch (err: any) {
    sendError(res, err.message || "Failed to fetch quotation details", 500);
  }
}

