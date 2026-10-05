import type { AppNotification, DocRequest, User } from "./types";

/**
 * REALISTIC DEMO DATA — used only to demonstrate the interface.
 * A future backend/database will replace this module entirely;
 * the rest of the app talks to it only through src/lib/store.tsx.
 */

export const seedUsers: User[] = [
  {
    id: "u1",
    name: "Aarav Mehta",
    email: "aarav@demo.ink",
    role: "user",
    phone: "+91 98000 00000",
    password: "demo123",
  },
  {
    id: "a1",
    name: "Archive Admin",
    email: "admin@demo.ink",
    role: "admin",
    password: "demo123",
  },
];

const baseReq = {
  fullName: "Aarav Mehta",
  age: "34",
  gender: "Male",
  email: "aarav@demo.ink",
  phone: "+91 98000 00000",
  address: "Demo Road, Indiranagar, Bengaluru",
};

export const seedRequests: DocRequest[] = [
  {
    id: "REQ-2417",
    userId: "u1",
    userName: "Aarav Mehta",
    document: { kind: "file", fileName: "Colonial Land Deed 1874.pdf", fileType: "pdf", fileSize: 5033165 },
    requirements: {
      ...baseReq,
      purpose:
        "This is a land deed from 1874 written in a dense formal hand. I want to know exactly which parcel it refers to and who the parties were.",
      processing: "Full transcription of the deed in plain modern language, with a short summary of the key terms.",
      outputFormat: "PDF (clean transcription)",
      instructions: "Please keep the original legal terms in brackets where the wording matters.",
      notes: "Page 2 has a water-damaged corner.",
    },
    submittedAt: "2026-02-18T09:40:00",
    updatedAt: "2026-02-18T09:40:00",
    status: "under_review",
  },
  {
    id: "REQ-2416",
    userId: "u1",
    userName: "Aarav Mehta",
    document: { kind: "file", fileName: "Family letters (1922–1931)", fileType: "images", fileSize: 32842893, fileCount: 14 },
    requirements: {
      ...baseReq,
      purpose:
        "Fourteen letters my great-grandmother wrote during 1922–1931. The ink has faded and the handwriting is very small. I want to preserve the content for my family.",
      processing: "Transcription of all letters, with a brief introduction placing each letter in context.",
      outputFormat: "Word document",
      instructions: "Please mark illegible words with [illegible] rather than guessing.",
      notes: "",
    },
    submittedAt: "2026-02-10T14:15:00",
    updatedAt: "2026-02-13T11:05:00",
    status: "quote_available",
    quote: {
      charge: 1450,
      estimatedDays: 5,
      expectedDate: "2026-02-20T00:00:00",
      adminMessage:
        "We have examined the letter images. The handwriting is faint in places but workable. The quote covers careful transcription of all fourteen letters.",
      extraInstructions: "We will transcribe each letter on its own page with the date at the top.",
      sentAt: "2026-02-13T11:05:00",
    },
  },
  {
    id: "REQ-2415",
    userId: "u1",
    userName: "Aarav Mehta",
    document: { kind: "file", fileName: "Merchant Ledger 1901.docx", fileType: "doc", fileSize: 1258291 },
    requirements: {
      ...baseReq,
      purpose:
        "A merchant's ledger from 1901 with old accounting abbreviations. I need the entries cleaned up so I can research the trading history of the firm.",
      processing: "Clean transcription with a glossary of the abbreviations and an index of entries by month.",
      outputFormat: "Excel-friendly CSV + PDF",
      instructions: "Keep original column order; add a second clean sheet for decoded values.",
      notes: "Some amounts use pre-decimal notation.",
    },
    submittedAt: "2026-01-28T10:20:00",
    updatedAt: "2026-02-03T16:45:00",
    status: "payment_pending",
    quote: {
      charge: 2300,
      estimatedDays: 7,
      expectedDate: "2026-02-14T00:00:00",
      adminMessage:
        "The ledger is in reasonable condition. The pre-decimal amounts will be shown both as written and as modern values.",
      extraInstructions: "",
      sentAt: "2026-02-01T09:30:00",
    },
    payment: { status: "pending" },
  },
  {
    id: "REQ-2414",
    userId: "u1",
    userName: "Aarav Mehta",
    document: {
      kind: "drive",
      fileName: "Ship Manifest — SS Kaveri, 1918 (Drive folder)",
      fileType: "link",
      driveUrl: "https://drive.google.com/drive/folders/demo-ss-kaveri-1918",
    },
    requirements: {
      ...baseReq,
      purpose:
        "A passenger manifest from the SS Kaveri, 1918. I am tracing three families who emigrated that year and need the entries in a searchable form.",
      processing: "Full transcription of all passenger entries into a structured list, with a short note on the vessel.",
      outputFormat: "PDF + CSV",
      instructions: "Names should be transcribed exactly as written, with a modern reading in a second column.",
      notes: "The folder on Drive contains 22 page images.",
    },
    submittedAt: "2026-01-20T12:00:00",
    updatedAt: "2026-01-26T09:10:00",
    status: "processing",
    quote: {
      charge: 3200,
      estimatedDays: 10,
      expectedDate: "2026-02-05T00:00:00",
      adminMessage:
        "The manifest pages are readable, though a few names are stamped over the printed forms. We quote for all 22 pages.",
      extraInstructions: "We will flag entries where two different readings are possible.",
      sentAt: "2026-01-24T10:00:00",
    },
    payment: { status: "successful", transactionId: "TRX-8F3K2A", amount: 3200, paidAt: "2026-01-25T18:22:00" },
    adminNote: "Working through pages 9–18. Stamped names on page 12 will be cross-checked with the cabin list.",
  },
  {
    id: "REQ-2413",
    userId: "u1",
    userName: "Aarav Mehta",
    document: { kind: "file", fileName: "City Gazette 1911.pdf", fileType: "pdf", fileSize: 6606029 },
    requirements: {
      ...baseReq,
      purpose:
        "An edition of the City Gazette from 1911. I need the news articles on the new railway line extracted and made readable.",
      processing: "Extract the railway-related articles into one clean document with a short index.",
      outputFormat: "PDF",
      instructions: "Please include the original headline of each article.",
      notes: "",
    },
    submittedAt: "2026-01-06T08:30:00",
    updatedAt: "2026-01-17T15:40:00",
    status: "completed",
    quote: {
      charge: 1800,
      estimatedDays: 8,
      expectedDate: "2026-01-18T00:00:00",
      adminMessage:
        "The print is clear. We will extract the six railway-related articles and set them out in a modern layout.",
      extraInstructions: "",
      sentAt: "2026-01-09T11:20:00",
    },
    payment: { status: "successful", transactionId: "TRX-2C9Q7B", amount: 1800, paidAt: "2026-01-10T09:05:00" },
    completion: {
      fileName: "City Gazette 1911 — Railway Articles.pdf",
      fileLabel: "Processed document (PDF)",
      note: "Six articles extracted and indexed. Original headlines retained; two illegible words are marked [illegible].",
      message: "Thank you for entrusting us with the Gazette edition. We hope the extraction serves your research well.",
      completedAt: "2026-01-17T15:40:00",
    },
  },
  {
    id: "REQ-2412",
    userId: "u1",
    userName: "Aarav Mehta",
    document: { kind: "file", fileName: "Faded railway ticket.jpg", fileType: "image", fileSize: 2202009 },
    requirements: {
      ...baseReq,
      purpose: "A very faded railway ticket from the 1890s. I wanted the destination and date read if possible.",
      processing: "Read and transcribe the printed and stamped details on the ticket.",
      outputFormat: "Short note (PDF)",
      instructions: "",
      notes: "",
    },
    submittedAt: "2025-12-30T13:00:00",
    updatedAt: "2026-01-04T10:10:00",
    status: "rejected",
    rejection: {
      reason: "Document unreadable — ink has faded beyond recovery in the submitted scan.",
      message:
        "Unfortunately, this request could not be accepted. After examining the image, the printed details have faded too far for us to read with confidence. If you can share a higher-resolution scan or a photograph in different lighting, we would be glad to review it again.",
      at: "2026-01-04T10:10:00",
    },
  },
];

export const seedNotifications: AppNotification[] = [
  {
    id: "n1",
    forRole: "user",
    userId: "u1",
    title: "Your request has been received.",
    body: "Request REQ-2417 (Colonial Land Deed 1874.pdf) is now under review by our team.",
    at: "2026-02-18T09:41:00",
    read: false,
    tone: "info",
  },
  {
    id: "n2",
    forRole: "user",
    userId: "u1",
    title: "Your quotation is ready.",
    body: "The quote for request REQ-2416 (Family letters) is ready. Approve it and pay to begin processing.",
    at: "2026-02-13T11:06:00",
    read: false,
    tone: "success",
  },
  {
    id: "n3",
    forRole: "user",
    userId: "u1",
    title: "Payment is required to begin processing.",
    body: "Request REQ-2415 (Merchant Ledger 1901) is waiting on payment of ₹2,300.",
    at: "2026-02-03T16:46:00",
    read: false,
    tone: "warning",
  },
  {
    id: "n4",
    forRole: "user",
    userId: "u1",
    title: "Your document is currently being processed.",
    body: "Our team has started working on request REQ-2414 (Ship Manifest — SS Kaveri).",
    at: "2026-01-26T09:11:00",
    read: true,
    tone: "info",
  },
  {
    id: "n5",
    forRole: "user",
    userId: "u1",
    title: "Your completed document is available.",
    body: "Request REQ-2413 (City Gazette 1911) is complete. Download your processed file any time.",
    at: "2026-01-17T15:41:00",
    read: true,
    tone: "success",
  },
  {
    id: "n6",
    forRole: "user",
    userId: "u1",
    title: "Your request could not be accepted.",
    body: "Request REQ-2412 (Faded railway ticket) was reviewed. Please see the note from our team for details.",
    at: "2026-01-04T10:11:00",
    read: true,
    tone: "danger",
  },
  {
    id: "n7",
    forRole: "admin",
    title: "New request submitted.",
    body: "Aarav Mehta submitted request REQ-2417 — Colonial Land Deed 1874.pdf. It is waiting for review.",
    at: "2026-02-18T09:41:00",
    read: false,
    tone: "info",
  },
  {
    id: "n8",
    forRole: "admin",
    title: "Request awaiting payment.",
    body: "Request REQ-2415 has an open quote of ₹2,300. The user has not paid yet.",
    at: "2026-02-03T16:47:00",
    read: false,
    tone: "warning",
  },
  {
    id: "n9",
    forRole: "admin",
    title: "Payment received for Request #2414.",
    body: "₹3,200 recorded (TRX-8F3K2A). Placeholder — live payment alerts will arrive through your backend / n8n workflows once connected.",
    at: "2026-01-25T18:23:00",
    read: true,
    tone: "success",
  },
];
