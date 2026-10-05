/**
 * Core domain types.
 * These mirror what a future backend API would return, so the
 * UI can be pointed at a real service later without redesign.
 */

export type Role = "user" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  password?: string; // mock only — replaced by a real auth system later
}

export type RequestStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "accepted"
  | "rejected"
  | "quote_available"
  | "payment_pending"
  | "payment_received"
  | "processing"
  | "completed";

export type PaymentStatus = "none" | "pending" | "verifying" | "successful" | "failed";

export type DocType = "pdf" | "doc" | "slides" | "image" | "images" | "link" | "other";

export interface SourceDoc {
  kind: "file" | "drive";
  /** file display name(s) or a label for a drive link */
  fileName: string;
  fileType: DocType;
  fileSize?: number; // bytes
  fileCount?: number; // e.g. number of images in the set
  driveUrl?: string;
}

export interface Requirements {
  fullName: string;
  age: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  purpose: string;
  processing: string;
  outputFormat: string;
  instructions: string;
  notes: string;
}

export interface Quote {
  charge: number;
  estimatedDays: number;
  expectedDate: string; // ISO
  adminMessage: string;
  extraInstructions: string;
  sentAt: string; // ISO
}

export interface PaymentInfo {
  id?: string;
  status: PaymentStatus;
  transactionId?: string;
  gatewayOrderId?: string;
  amount?: number;
  paidAt?: string;
}

export interface CompletionInfo {
  fileName: string;
  fileLabel: string;
  note: string;
  message: string;
  completedAt: string;
}

export interface RejectionInfo {
  reason: string;
  message: string;
  at: string;
}

export interface DocRequest {
  id: string; // e.g. REQ-2417
  userId: string;
  userName: string;
  document: SourceDoc;
  requirements: Requirements;
  submittedAt: string; // ISO
  updatedAt: string; // ISO
  status: RequestStatus;
  rejection?: RejectionInfo;
  quote?: Quote;
  payment?: PaymentInfo;
  completion?: CompletionInfo;
  adminNote?: string;
}

export type NotifTone = "info" | "success" | "warning" | "danger";

export interface AppNotification {
  id: string;
  forRole: Role;
  userId?: string;
  title: string;
  body: string;
  at: string; // ISO
  read: boolean;
  tone: NotifTone;
}

export interface Toast {
  id: string;
  title: string;
  body?: string;
  tone: NotifTone;
}

export interface SubmitPayload {
  document: SourceDoc;
  requirements: Requirements;
}
