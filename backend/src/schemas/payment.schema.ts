import { z } from "zod";

export const CreatePaymentOrderSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
});

export const VerifyPaymentSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
  razorpay_order_id: z.string().min(1, "Razorpay Order ID is required"),
  razorpay_payment_id: z.string().min(1, "Razorpay Payment ID is required"),
  razorpay_signature: z.string().min(1, "Razorpay Signature is required"),
  paymentMethod: z.string().optional(),
});

export const AdminCreatePaymentSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  currency: z.string().default("INR"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  transactionId: z.string().optional(),
  gatewayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  status: z.enum(["SUCCESSFUL", "PENDING", "FAILED"]).default("SUCCESSFUL"),
  notes: z.string().optional(),
});

export type CreatePaymentOrderInput = z.infer<typeof CreatePaymentOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof VerifyPaymentSchema>;
export type AdminCreatePaymentInput = z.infer<typeof AdminCreatePaymentSchema>;

export const AdminRazorpayConfigSchema = z.object({
  razorpayKeyId: z.string().min(1, "Key ID is required"),
  razorpayKeySecret: z.string().min(1, "Key Secret is required"),
});

export type AdminRazorpayConfigInput = z.infer<typeof AdminRazorpayConfigSchema>;
