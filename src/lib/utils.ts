import { brand } from "../config/brand";
import type { DocRequest, DocType, PaymentStatus, RequestStatus } from "./types";

let counter = 0;
export const uid = (prefix = "id") => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`;

export const nowIso = () => new Date().toISOString();

export function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtDateTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) +
    ", " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr${h > 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d > 1 ? "s" : ""} ago`;
  return fmtDate(iso);
}

export function fmtBytes(n?: number) {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export const fmtMoney = (n: number) => `${brand.currency}${n.toLocaleString("en-IN")}`;

/* ---------------- status system ---------------- */

export const statusOrder: Record<RequestStatus, number> = {
  draft: 0,
  submitted: 1,
  under_review: 2,
  accepted: 3,
  quote_available: 4,
  payment_pending: 5,
  payment_received: 6,
  processing: 7,
  completed: 8,
  rejected: -1,
};

export type BadgeTone =
  | "neutral" | "slate" | "amber" | "green" | "red" | "gold" | "clay" | "teal" | "indigo" | "moss";

export const statusMeta: Record<RequestStatus, { label: string; tone: BadgeTone; hint: string }> = {
  draft: { label: "Draft", tone: "neutral", hint: "Not yet submitted." },
  submitted: { label: "Submitted", tone: "slate", hint: "Received by our team." },
  under_review: { label: "Under Review", tone: "amber", hint: "Our team is reviewing your document." },
  accepted: { label: "Accepted", tone: "green", hint: "Accepted for processing." },
  rejected: { label: "Rejected", tone: "red", hint: "Could not be accepted — see the note from our team." },
  quote_available: { label: "Quote Available", tone: "gold", hint: "Your quotation is ready. Approve it and pay to begin." },
  payment_pending: { label: "Payment Pending", tone: "clay", hint: "Awaiting payment to begin processing." },
  payment_received: { label: "Payment Received", tone: "teal", hint: "Payment confirmed. Processing begins shortly." },
  processing: { label: "Processing", tone: "indigo", hint: "Our team is working on your document." },
  completed: { label: "Completed", tone: "moss", hint: "Your processed document is ready to download." },
};

export const paymentMeta: Record<PaymentStatus, { label: string; tone: BadgeTone }> = {
  none: { label: "Not started", tone: "neutral" },
  pending: { label: "Pending", tone: "clay" },
  verifying: { label: "Verification pending", tone: "amber" },
  successful: { label: "Successful", tone: "moss" },
  failed: { label: "Failed", tone: "red" },
};

export const docTypeLabel: Record<DocType, string> = {
  pdf: "PDF document",
  doc: "Word document",
  slides: "Presentation (PPT/PPTX)",
  image: "Image",
  images: "Multiple images",
  link: "Google Drive link",
  other: "Document file",
};

/* ---------------- timeline ---------------- */

export interface Stage {
  key: string;
  label: string;
  state: "done" | "current" | "pending" | "rejected";
  date?: string;
  detail?: string;
}

export function buildTimeline(req: DocRequest): Stage[] {
  const o = statusOrder[req.status];
  const rejected = req.status === "rejected";
  return [
    {
      key: "submitted",
      label: "Request Submitted",
      state: o >= 1 ? "done" : "pending",
      date: req.submittedAt,
    },
    {
      key: "review",
      label: "Admin Review",
      state: rejected || o >= 3 ? "done" : o >= 1 && !rejected ? "current" : "pending",
    },
    rejected
      ? {
          key: "decision",
          label: "Request Rejected",
          state: "rejected" as const,
          date: req.rejection?.at,
          detail: req.rejection?.reason,
        }
      : { key: "decision", label: "Request Accepted", state: o >= 3 ? "done" : "pending" },
    {
      key: "quote",
      label: "Quote Sent",
      state: o >= 4 ? "done" : "pending",
      date: req.quote?.sentAt,
      detail: req.quote ? `${fmtMoney(req.quote.charge)} · ~${req.quote.estimatedDays} days` : undefined,
    },
    {
      key: "payment",
      label: "Payment Received",
      state: req.payment?.status === "successful" ? "done" : o >= 5 && o < 6 ? "current" : "pending",
      date: req.payment?.paidAt,
      detail: req.payment?.transactionId,
    },
    {
      key: "processing",
      label: "Processing Started",
      state: o >= 8 ? "done" : o === 7 ? "current" : "pending",
    },
    {
      key: "completed",
      label: "Document Completed",
      state: o >= 8 ? "done" : "pending",
      date: req.completion?.completedAt,
    },
  ];
}

/* ---------------- mock file download (frontend only) ---------------- */

export function downloadMockFile(req: DocRequest, which: "original" | "completed") {
  const isOriginal = which === "original";
  const file = isOriginal ? req.document.fileName : req.completion?.fileName ?? "processed-document.pdf";
  const safeName = file.replace(/[^\w.\-]+/g, "_");
  const content = [
    `${brand.name} — demo file (frontend preview only)`,
    `------------------------------------------------`,
    `Request ID     : ${req.id}`,
    `Document       : ${file}`,
    `Type           : ${isOriginal ? "Original submission" : "Completed (processed) document"}`,
    `Submitted      : ${fmtDateTime(req.submittedAt)}`,
    isOriginal && req.quote ? `Est. charge    : ${fmtMoney(req.quote.charge)}` : null,
    !isOriginal ? `Completed      : ${fmtDateTime(req.completion?.completedAt)}` : null,
    !isOriginal && req.completion ? `Admin note     : ${req.completion.note}` : null,
    ``,
    isOriginal
      ? "This is a placeholder file for the demo interface. In the live product your original upload will be served from secure file storage."
      : "This is a placeholder file for the demo interface. In the live product the processed file uploaded by our team will be served here.",
  ]
    .filter(Boolean)
    .join("\n");
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${req.id}-${safeName}`;
  a.click();
  URL.revokeObjectURL(url);
}
