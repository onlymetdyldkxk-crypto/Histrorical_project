import { z } from "zod";

export const SendQuoteSchema = z.object({
  charge: z.number().positive("Charge amount must be positive"),
  estimatedDays: z.number().int().min(1, "Estimated days must be at least 1"),
  expectedDate: z.string().min(1, "Expected date is required"),
  adminMessage: z.string().min(5, "Admin quote message must be at least 5 characters"),
  extraInstructions: z.string().optional(),
});

export const RejectRequestSchema = z.object({
  reason: z.string().min(3, "Reason is required"),
  message: z.string().min(5, "Detailed message is required"),
});

export const AdminNoteSchema = z.object({
  note: z.string(),
});

export const CompleteRequestSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  fileLabel: z.string().min(1, "File label is required"),
  note: z.string().min(1, "Completion internal note is required"),
  message: z.string().min(5, "Completion message for client is required"),
  storageKey: z.string().optional(),
});

export type SendQuoteInput = z.infer<typeof SendQuoteSchema>;
export type RejectRequestInput = z.infer<typeof RejectRequestSchema>;
export type AdminNoteInput = z.infer<typeof AdminNoteSchema>;
export type CompleteRequestInput = z.infer<typeof CompleteRequestSchema>;
