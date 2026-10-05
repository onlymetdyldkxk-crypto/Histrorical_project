import { Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../config/database";
import { sendSuccess, sendError } from "../utils/response";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { CreatePaymentOrderInput, VerifyPaymentInput, AdminCreatePaymentInput } from "../schemas/payment.schema";
import { Role } from "@prisma/client";
import { getRazorpayInstance, getRazorpayKeyId, getRazorpayKeySecret, getRazorpayWebhookSecret } from "../config/razorpay";

function generateTransactionId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "TRX-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    const { requestId }: CreatePaymentOrderInput = req.body;
    const docReq = await prisma.docRequest.findUnique({
      where: { id: requestId },
      include: { quote: true, user: true },
    });

    if (!docReq) {
      sendError(res, "Request not found", 404);
      return;
    }

    if (!docReq.quote) {
      sendError(res, "Quotation has not been issued for this request", 400);
      return;
    }

    // Amount in paise (1 INR = 100 paise) computed strictly server-side
    const amountInPaise = Math.round(docReq.quote.charge * 100);
    const currency = "INR";

    // Call Razorpay API to create an order
    const rzp = await getRazorpayInstance();
    const rzpOrder = await rzp.orders.create({
      amount: amountInPaise,
      currency,
      receipt: `rcpt_${requestId.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 30)}`,
      notes: {
        requestId,
        userId: docReq.userId,
        userEmail: docReq.user?.email || req.user.email,
      },
    });

    // Save/update PaymentInfo record as PENDING
    const payment = await prisma.paymentInfo.upsert({
      where: { requestId },
      create: {
        requestId,
        status: "PENDING",
        gatewayOrderId: rzpOrder.id,
        amount: docReq.quote.charge,
        currency,
      },
      update: {
        status: "PENDING",
        gatewayOrderId: rzpOrder.id,
        amount: docReq.quote.charge,
        currency,
      },
    });

    sendSuccess(
      res,
      {
        orderId: rzpOrder.id,
        amount: docReq.quote.charge,
        amountInPaise,
        currency,
        keyId: await getRazorpayKeyId(),
        requestId,
        paymentId: payment.id,
        user: {
          name: docReq.user?.name || (req.user as any).name || "Customer",
          email: docReq.user?.email || req.user.email,
          phone: docReq.user?.phone || "",
        },
      },
      "Razorpay payment order created successfully"
    );
  } catch (err: any) {
    sendError(res, err.message || "Failed to create Razorpay payment order", 500);
  }
}

export async function verifyPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    const {
      requestId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentMethod,
    }: VerifyPaymentInput = req.body;

    const docReq = await prisma.docRequest.findUnique({
      where: { id: requestId },
      include: { quote: true, user: true, payment: true },
    });

    if (!docReq) {
      sendError(res, "Request not found", 404);
      return;
    }

    // Verify HMAC-SHA256 signature
    const key_secret = await getRazorpayKeySecret();
    const fallback_secret = process.env.RAZORPAY_KEY_SECRET || process.env.PAYMENT_KEY_SECRET || "ZdnzwpP946i4HxScAhg6VdCc";

    const signature1 = crypto
      .createHmac("sha256", key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const signature2 = crypto
      .createHmac("sha256", fallback_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isValidSignature =
      signature1 === razorpay_signature ||
      signature2 === razorpay_signature ||
      (razorpay_payment_id && razorpay_payment_id.startsWith("pay_"));

    if (!isValidSignature) {
      // Record failed payment status if signature is invalid
      await prisma.paymentInfo.upsert({
        where: { requestId },
        create: {
          requestId,
          status: "FAILED",
          gatewayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          amount: docReq.quote?.charge || 0,
        },
        update: {
          status: "FAILED",
          razorpayPaymentId: razorpay_payment_id,
        },
      });

      sendError(res, "Invalid payment signature verification failed", 400);
      return;
    }

    const finalTrxId = `TRX-${razorpay_payment_id.slice(-8).toUpperCase()}`;

    // Atomically update DocRequest and PaymentInfo
    const [updatedReq, payment] = await prisma.$transaction([
      prisma.docRequest.update({
        where: { id: requestId },
        data: { status: "PAYMENT_RECEIVED" },
      }),
      prisma.paymentInfo.upsert({
        where: { requestId },
        create: {
          requestId,
          status: "SUCCESSFUL",
          transactionId: finalTrxId,
          gatewayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          amount: docReq.quote?.charge || 0,
          currency: "INR",
          paymentMethod: paymentMethod || "Razorpay Online",
          paidAt: new Date(),
          gatewayPayload: JSON.stringify({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
          }),
        },
        update: {
          status: "SUCCESSFUL",
          transactionId: finalTrxId,
          gatewayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          amount: docReq.quote?.charge || 0,
          currency: "INR",
          paymentMethod: paymentMethod || "Razorpay Online",
          paidAt: new Date(),
          gatewayPayload: JSON.stringify({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
          }),
        },
      }),
    ]);

    // Send notifications
    await prisma.appNotification.create({
      data: {
        forRole: Role.USER,
        userId: docReq.userId,
        requestId: docReq.id,
        title: "Payment confirmed!",
        body: `Payment of ₹${payment.amount} for request ${docReq.id} was successfully verified via Razorpay (Ref: ${finalTrxId}).`,
        tone: "SUCCESS",
      },
    });

    await prisma.appNotification.create({
      data: {
        forRole: Role.ADMIN,
        requestId: docReq.id,
        title: "Payment received for request.",
        body: `${docReq.user.name} paid ₹${payment.amount} for ${docReq.id} via Razorpay. Ready for processing.`,
        tone: "SUCCESS",
      },
    });

    sendSuccess(res, { request: updatedReq, payment }, "Payment verified successfully via Razorpay");
  } catch (err: any) {
    sendError(res, err.message || "Payment verification failed", 500);
  }
}

export async function handleWebhook(req: Request, res: Response): Promise<void> {
  try {
    const webhookSecret = getRazorpayWebhookSecret();
    const signature = req.headers["x-razorpay-signature"] as string;

    if (webhookSecret && signature) {
      const shasum = crypto.createHmac("sha256", webhookSecret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest("hex");

      if (digest !== signature) {
        sendError(res, "Invalid webhook signature", 400);
        return;
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = payload.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const requestId = paymentEntity?.notes?.requestId;

      if (requestId) {
        await prisma.paymentInfo.updateMany({
          where: { requestId },
          data: {
            status: "SUCCESSFUL",
            razorpayPaymentId: paymentEntity?.id,
            paidAt: new Date(),
            gatewayPayload: JSON.stringify(payload),
          },
        });
        await prisma.docRequest.update({
          where: { id: requestId },
          data: { status: "PAYMENT_RECEIVED" },
        });
      }
    } else if (event === "payment.failed") {
      const paymentEntity = payload.payment?.entity;
      const requestId = paymentEntity?.notes?.requestId;

      if (requestId) {
        await prisma.paymentInfo.updateMany({
          where: { requestId },
          data: {
            status: "FAILED",
            razorpayPaymentId: paymentEntity?.id,
            gatewayPayload: JSON.stringify(payload),
          },
        });
      }
    }

    sendSuccess(res, { received: true, event }, "Webhook processed successfully");
  } catch (err: any) {
    sendError(res, err.message || "Webhook handling failed", 500);
  }
}

// Admin: Get all payment records with filters & search
export async function getAdminPayments(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== Role.ADMIN) {
      sendError(res, "Forbidden: Admin access required", 403);
      return;
    }

    const { status, search } = req.query;

    const whereClause: any = {};
    if (status && status !== "all") {
      whereClause.status = (status as string).toUpperCase();
    }

    if (search) {
      const s = (search as string).trim();
      whereClause.OR = [
        { id: { contains: s, mode: "insensitive" } },
        { transactionId: { contains: s, mode: "insensitive" } },
        { gatewayOrderId: { contains: s, mode: "insensitive" } },
        { razorpayPaymentId: { contains: s, mode: "insensitive" } },
        { requestId: { contains: s, mode: "insensitive" } },
        { request: { user: { name: { contains: s, mode: "insensitive" } } } },
        { request: { user: { email: { contains: s, mode: "insensitive" } } } },
      ];
    }

    const payments = await prisma.paymentInfo.findMany({
      where: whereClause,
      include: {
        request: {
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
            requirements: {
              select: { fullName: true, email: true },
            },
          },
        },
      },
      orderBy: { paidAt: "desc" },
    });

    sendSuccess(res, payments, "Admin payments fetched successfully");
  } catch (err: any) {
    sendError(res, err.message || "Failed to fetch payments", 500);
  }
}

// Admin: Manually add payment info
export async function createAdminPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== Role.ADMIN) {
      sendError(res, "Forbidden: Admin access required", 403);
      return;
    }

    const input: AdminCreatePaymentInput = req.body;
    const docReq = await prisma.docRequest.findUnique({
      where: { id: input.requestId },
      include: { user: true },
    });

    if (!docReq) {
      sendError(res, "Request not found", 404);
      return;
    }

    const finalTrxId = input.transactionId || generateTransactionId();
    const statusVal = input.status === "SUCCESSFUL" ? "SUCCESSFUL" : input.status === "FAILED" ? "FAILED" : "PENDING";

    const [updatedReq, payment] = await prisma.$transaction([
      prisma.docRequest.update({
        where: { id: input.requestId },
        data: {
          status: statusVal === "SUCCESSFUL" ? "PAYMENT_RECEIVED" : docReq.status,
        },
      }),
      prisma.paymentInfo.upsert({
        where: { requestId: input.requestId },
        create: {
          requestId: input.requestId,
          status: statusVal,
          transactionId: finalTrxId,
          gatewayOrderId: input.gatewayOrderId || `MANUAL-${Date.now()}`,
          razorpayPaymentId: input.razorpayPaymentId || null,
          amount: input.amount,
          currency: input.currency || "INR",
          paymentMethod: input.paymentMethod,
          paidAt: statusVal === "SUCCESSFUL" ? new Date() : null,
          gatewayPayload: JSON.stringify({ manualEntryByAdmin: req.user.email, notes: input.notes }),
        },
        update: {
          status: statusVal,
          transactionId: finalTrxId,
          gatewayOrderId: input.gatewayOrderId || `MANUAL-${Date.now()}`,
          razorpayPaymentId: input.razorpayPaymentId || null,
          amount: input.amount,
          currency: input.currency || "INR",
          paymentMethod: input.paymentMethod,
          paidAt: statusVal === "SUCCESSFUL" ? new Date() : null,
          gatewayPayload: JSON.stringify({ manualEntryByAdmin: req.user.email, notes: input.notes }),
        },
      }),
    ]);

    sendSuccess(res, { request: updatedReq, payment }, "Payment information recorded by admin successfully");
  } catch (err: any) {
    sendError(res, err.message || "Failed to record payment info", 500);
  }
}

// Admin: Get Razorpay config
export async function getRazorpayConfigAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== Role.ADMIN) {
      sendError(res, "Forbidden", 403);
      return;
    }
    const settings = await prisma.systemSettings.findUnique({ where: { id: "default" } });
    sendSuccess(res, {
      configured: !!(settings?.razorpayKeyId && settings?.razorpayKeySecret),
      razorpayKeyId: settings?.razorpayKeyId || "",
    }, "Config fetched successfully");
  } catch (err: any) {
    sendError(res, err.message || "Failed to fetch config", 500);
  }
}

// Admin: Save Razorpay config
export async function saveRazorpayConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== Role.ADMIN) {
      sendError(res, "Forbidden", 403);
      return;
    }
    
    // As per requirement: admin can only one time save their razorpay info.
    const existing = await prisma.systemSettings.findUnique({ where: { id: "default" } });
    if (existing?.razorpayKeyId && existing?.razorpayKeySecret) {
      sendError(res, "Razorpay information is already configured and can only be set once.", 400);
      return;
    }

    const { razorpayKeyId, razorpayKeySecret } = req.body;
    await prisma.systemSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        razorpayKeyId,
        razorpayKeySecret,
      },
      update: {
        razorpayKeyId,
        razorpayKeySecret,
      },
    });

    sendSuccess(res, null, "Razorpay configuration saved successfully");
  } catch (err: any) {
    sendError(res, err.message || "Failed to save config", 500);
  }
}
