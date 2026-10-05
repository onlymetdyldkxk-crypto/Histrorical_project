# Backend Requirements & Technical Specification
## Historical Document Conversion System

---

## 1. Existing Frontend Architecture

- **Core Framework**: React 19 (`react`, `react-dom`) with Vite 7.
- **Routing**: `react-router-dom` (v7) using `HashRouter` for client-side SPA navigation.
- **Styling**: Tailwind CSS (v4) with custom typography, custom utility classes, card ticks, badge tones, and responsive design systems.
- **State Management**: React Context-based state container (`StoreProvider` & `useStore` hook in `src/lib/store.tsx`) acting as the single domain service boundary for the entire application.
- **Component Architecture**:
  - `components/ui.tsx`: Reusable primitive components (`Button`, `Card`, `Input`, `Textarea`, `Select`, `Field`, `StatusBadge`, `PayBadge`, `Timeline`, `Stepper`, `Modal`, `ConfirmDialog`, `ToastHost`, `StatCard`, `EmptyState`, `LoadingPanel`, etc.).
  - `components/Navbar.tsx` & `components/Footer.tsx`: Universal navigation headers & footers with dynamic role-aware navigation links (User vs Admin).
- **Route Protection**:
  - `RequireAuth`: Guard ensuring `user` state exists, redirecting unauthenticated users to `/login`.
  - `RequireAdmin`: Guard enforcing `user.role === "admin"`, redirecting non-admins to `/dashboard`.

---

## 2. All Entities & Models Required by Backend

### User
- `id`: Unique identifier (UUID).
- `name`: Full user name.
- `email`: Unique email address.
- `passwordHash`: Bcrypt / Argon2 hashed password.
- `role`: Enum (`"user"` | `"admin"`).
- `phone`: Optional phone string.
- `createdAt`: Timestamp.
- `updatedAt`: Timestamp.

### DocRequest
- `id`: Unique human-readable request ID (e.g. `REQ-2417`).
- `userId`: Foreign key reference to `User.id`.
- `status`: Enum (`RequestStatus`).
- `submittedAt`: ISO Timestamp.
- `updatedAt`: ISO Timestamp.
- `adminNote`: Optional internal working notes recorded by administrators.

### SourceDoc (Attached to DocRequest)
- `kind`: Enum (`"file"` | `"drive"`).
- `fileName`: Display name of file or Drive link label.
- `fileType`: Enum (`DocType`: `"pdf"` | `"doc"` | `"slides"` | `"image"` | `"images"` | `"link"` | `"other"`).
- `fileSize`: Optional file size in bytes.
- `fileCount`: Optional count of files in set.
- `driveUrl`: Optional Google Drive URL.
- `storageKey`: S3 / Object Storage object key.

### Requirements (Attached to DocRequest)
- `fullName`: Contact full name.
- `age`: Optional age string.
- `gender`: Optional gender string.
- `email`: Contact email address.
- `phone`: Optional contact phone.
- `address`: Optional address.
- `purpose`: Reason & focus of processing.
- `processing`: Detailed description of work requested.
- `outputFormat`: Preferred format (e.g. `"PDF (clean transcription)"`, `"Word document"`, etc.).
- `instructions`: Optional extra instructions.
- `notes`: Optional user notes.

### Quote
- `requestId`: Foreign key reference to `DocRequest.id`.
- `charge`: Processing fee in local currency (Decimal/Integer).
- `estimatedDays`: Estimated processing turnaround in days.
- `expectedDate`: Expected completion date (ISO Timestamp).
- `adminMessage`: Quotation message from administration team.
- `extraInstructions`: Optional additional administrative instructions.
- `sentAt`: Timestamp when quote was dispatched.

### PaymentInfo
- `requestId`: Foreign key reference to `DocRequest.id`.
- `status`: Enum (`PaymentStatus`: `"none"` | `"pending"` | `"verifying"` | `"successful"` | `"failed"`).
- `transactionId`: Optional payment gateway reference (e.g., `TRX-8F3K2A`).
- `gatewayOrderId`: Optional provider order ID (e.g., Razorpay/Stripe order ID).
- `amount`: Transaction amount paid.
- `paidAt`: ISO Timestamp when payment was confirmed.
- `gatewayPayload`: Raw webhook payload/audit JSON.

### RejectionInfo
- `requestId`: Foreign key reference to `DocRequest.id`.
- `reason`: One-line summary reason for rejection.
- `message`: Detailed note to user explaining rejection.
- `rejectedAt`: ISO Timestamp when rejected.

### CompletionInfo
- `requestId`: Foreign key reference to `DocRequest.id`.
- `fileName`: Output filename (e.g. `City Gazette 1911 — Railway Articles.pdf`).
- `fileLabel`: Label description (e.g. `Processed document (PDF)`).
- `note`: Internal working note on completion details.
- `message`: Customer-facing completion message.
- `storageKey`: Storage key for downloading completed file.
- `completedAt`: ISO Timestamp when marked complete.

### AppNotification
- `id`: Unique identifier (UUID).
- `forRole`: Enum (`"user"` | `"admin"`).
- `userId`: Optional target user ID (null for role-wide admin notifications).
- `requestId`: Optional reference request ID.
- `title`: Short notification title.
- `body`: Notification description body.
- `tone`: Enum (`"info"` | `"success"` | `"warning"` | `"danger"`).
- `read`: Boolean flag.
- `createdAt`: ISO Timestamp.

---

## 3. All User Roles

1. **`user` (Customer / Client)**:
   - Registers, logs in, manages profile.
   - Submits document conversion requests (Uploads PDFs/Word/Images or provides Google Drive URL).
   - Views personal dashboard and request tracking details.
   - Receives quotations and reviews admin feedback.
   - Executes secure online payments for accepted quotes.
   - Downloads completed, transcribed, or extracted historical documents.
   - Receives in-app notifications and email/SMS alerts.

2. **`admin` (Archive Administrator / Transcriber)**:
   - Accesses executive overview dashboard & request analytics.
   - Searches, filters, and inspects all system document requests.
   - Performs manual review of submitted documents & requirements.
   - Issues binding quotations (`charge`, `estimatedDays`, `expectedDate`, instructions).
   - Rejects unprocessable requests with structured reasons.
   - Records internal working notes and research findings.
   - Initiates processing workflow once payment is verified.
   - Uploads final processed output documents and completes request lifecycle.

---

## 4. Complete Request/Document Status Workflow

```
[User Submits Request]
         │
         ▼
    under_review
         │
         ├─────────────────────────────────────────┐
         │ (Admin Rejects)                         │ (Admin Accepts & Quotes)
         ▼                                         ▼
     rejected                              quote_available
(Terminal State)                                   │
                                                   │ (User clicks "Proceed to Payment")
                                                   ▼
                                            payment_pending ◄────┐ (User retries failed payment)
                                                   │             │
                                                   ├─────────────┘ (Payment Fails)
                                                   │
                                                   │ (Payment Successful)
                                                   ▼
                                           payment_received
                                                   │
                                                   │ (Admin clicks "Start Processing")
                                                   ▼
                                              processing
                                                   │
                                                   │ (Admin uploads final file & completes)
                                                   ▼
                                               completed
                                            (Terminal State)
```

### Status Lifecycle Definitions (`RequestStatus`):
- `draft`: Request created but not yet submitted (optional client state).
- `submitted` / `under_review`: Request submitted by client, awaiting manual admin review.
- `rejected`: Admin determined document cannot be processed (e.g. unreadable scan).
- `quote_available`: Admin approved document and issued price/timeline quote.
- `payment_pending`: Client initiated payment step; awaiting payment gateway processing.
- `payment_received`: Payment confirmed by gateway; awaiting admin processing start.
- `processing`: Admin/expert team actively transcribing or converting document.
- `completed`: Processing complete; final document uploaded and available for client download.

---

## 5. Required REST API Endpoints

### 6. Authentication APIs
- `POST /api/v1/auth/signup`: Register new customer account (`name`, `email`, `phone`, `password`).
- `POST /api/v1/auth/login`: Authenticate user (`email`, `password`) -> Returns JWT token & user profile.
- `POST /api/v1/auth/logout`: Invalidate session/token.
- `POST /api/v1/auth/forgot-password`: Initiate password reset email/link (`email`).
- `POST /api/v1/auth/reset-password`: Complete password reset (`token`, `newPassword`).
- `GET  /api/v1/auth/me`: Fetch current authenticated user session details.

### 7. Admin APIs
- `GET  /api/v1/admin/overview`: Fetch administrative dashboard counter metrics (New, Pending, Quoted, Paid, Processing, Completed).
- `GET  /api/v1/admin/requests`: Paginated list of all requests with filters (`q`, `status`, `dateRange`, `payStatus`, `fileType`, `sort`).
- `GET  /api/v1/admin/requests/:id`: Fetch complete administrative request detail view.
- `PUT  /api/v1/admin/requests/:id/note`: Save internal admin working notes.
- `POST /api/v1/admin/requests/:id/start-processing`: Transition request status from `payment_received` to `processing`.
- `POST /api/v1/admin/requests/:id/complete`: Attach final file, set completion note/message, transition status to `completed`.

### 8. File Upload & Storage APIs
- `POST /api/v1/files/presigned-url`: Generate S3/Cloud Storage presigned upload URL (`fileName`, `fileType`, `fileSize`, `purpose`).
- `POST /api/v1/files/upload`: Direct multipart file upload endpoint (fallback).
- `GET  /api/v1/files/download/:fileKey`: Stream file or generate presigned download URL (with strict ownership authorization).

### 9. Quotation APIs
- `POST /api/v1/admin/requests/:id/quote`: Submit quotation (`charge`, `estimatedDays`, `expectedDate`, `adminMessage`, `extraInstructions`). Changes status to `quote_available`.
- `POST /api/v1/admin/requests/:id/reject`: Reject request (`reason`, `message`). Changes status to `rejected`.
- `GET  /api/v1/requests/:id/quote`: Fetch quote details for a specific request.

### 10. Payment APIs
- `POST /api/v1/payments/create-order`: Initiate payment order with gateway (`requestId`). Returns gateway order reference (`orderId`, `amount`, `currency`, `key`).
- `POST /api/v1/payments/verify`: Verify payment signature/status (`requestId`, `paymentId`, `orderId`, `signature`). Updates status to `payment_received`.
- `POST /api/v1/payments/webhook`: Asynchronous payment provider webhook listener for live transaction status updates.

### 11. Notification APIs
- `GET   /api/v1/notifications`: Fetch user or admin notifications.
- `PATCH /api/v1/notifications/:id/read`: Mark a specific notification as read.
- `POST  /api/v1/notifications/mark-all-read`: Mark all notifications as read for current user/role.

### User Document Request APIs
- `POST /api/v1/requests`: Submit a new document request (`document`, `requirements`).
- `GET  /api/v1/requests`: Fetch user's own document requests.
- `GET  /api/v1/requests/:id`: Fetch detailed request by ID.

---

## 12. Database Tables & Relationships

```mermaid
erDiagram
    users ||--o{ doc_requests : "submits"
    users ||--o{ notifications : "receives"
    doc_requests ||--|| source_documents : "has"
    doc_requests ||--|| requirements : "has"
    doc_requests ||--o| quotes : "has"
    doc_requests ||--o| payments : "has"
    doc_requests ||--o| rejections : "has"
    doc_requests ||--o| completions : "has"
    doc_requests ||--o{ notifications : "triggers"

    users {
        uuid id PK
        string name
        string email UK
        string password_hash
        enum role
        string phone
        timestamp created_at
        timestamp updated_at
    }

    doc_requests {
        string id PK
        uuid user_id FK
        enum status
        text admin_note
        timestamp submitted_at
        timestamp updated_at
    }

    source_documents {
        uuid id PK
        string request_id FK
        enum kind
        string file_name
        enum file_type
        bigint file_size
        int file_count
        string drive_url
        string storage_key
    }

    requirements {
        uuid id PK
        string request_id FK
        string full_name
        string age
        string gender
        string email
        string phone
        text address
        text purpose
        text processing
        string output_format
        text instructions
        text notes
    }

    quotes {
        uuid id PK
        string request_id FK
        decimal charge
        int estimated_days
        timestamp expected_date
        text admin_message
        text extra_instructions
        timestamp sent_at
    }

    payments {
        uuid id PK
        string request_id FK
        enum status
        string transaction_id
        string gateway_order_id
        decimal amount
        timestamp paid_at
        jsonb gateway_payload
    }

    rejections {
        uuid id PK
        string request_id FK
        text reason
        text message
        timestamp rejected_at
    }

    completions {
        uuid id PK
        string request_id FK
        string file_name
        string file_label
        text note
        text message
        string storage_key
        timestamp completed_at
    }

    notifications {
        uuid id PK
        enum for_role
        uuid user_id FK
        string request_id FK
        string title
        text body
        enum tone
        boolean read
        timestamp created_at
    }
```

---

## 13. Required Environment Variables

```env
# Server Config
PORT=5000
NODE_ENV=production
CORS_ORIGIN=http://localhost:5173

# Database Config
DATABASE_URL=postgresql://user:password@localhost:5432/historical_doc_db

# Authentication
JWT_SECRET=super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d

# File Storage Config (S3 / Cloudflare R2 / AWS)
STORAGE_PROVIDER=s3
STORAGE_BUCKET_NAME=historical-doc-archive
STORAGE_REGION=ap-south-1
STORAGE_ACCESS_KEY=your_aws_access_key
STORAGE_SECRET_KEY=your_aws_secret_key

# Payment Gateway Config (Razorpay / Stripe)
PAYMENT_GATEWAY=razorpay
PAYMENT_KEY_ID=rzp_live_xxxxxxxxxxxx
PAYMENT_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
PAYMENT_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx

# Email Service Config (SMTP / Resend / SendGrid)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
EMAIL_FROM=notifications@historicaldocs.archive

# SMS & WhatsApp Integration
SMS_PROVIDER_API_KEY=your_sms_api_key

# Automation Workflows (n8n Integration)
N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook/historical-doc-events
N8N_API_KEY=your_n8n_api_key
```

---

## 14. External Services Required

1. **Database Hosting**: PostgreSQL (Supabase, Neon, AWS RDS, or PostgreSQL cloud instance).
2. **Object Storage**: AWS S3, Cloudflare R2, or Google Cloud Storage for secure storage of original and completed historical document files.
3. **Payment Gateway**: Razorpay, Stripe, or PayPal for processing customer payments and handling webhooks.
4. **Transactional Email Service**: Resend, SendGrid, or AWS SES for authentication emails, quotes, payment receipts, and completion alerts.
5. **SMS & Messaging Gateway**: Twilio or Fast2SMS / WhatsApp Business API for automated SMS updates.
6. **Workflow Automation Engine**: **n8n** (Self-hosted or Cloud) for orchestrating admin notifications, payment updates, multi-channel customer communications, and background processing jobs.

---

## 15. Frontend Files Needing Future API Integration

| Frontend File | Current Mock Functionality | Required API Integration |
|---|---|---|
| [src/lib/store.tsx](file:///c:/Users/dashr/OneDrive/Desktop/historical%20project/historical-document-conversion-frontend/src/lib/store.tsx) | `seedUsers`, `seedRequests`, `seedNotifications`, local state mutations | Replace with HTTP API client (`axios`/`fetch`) querying backend REST endpoints |
| [src/pages/AuthPages.tsx](file:///c:/Users/dashr/OneDrive/Desktop/historical%20project/historical-document-conversion-frontend/src/pages/AuthPages.tsx) | Simulated timer-based login, signup, and password reset | Connect forms to `POST /api/v1/auth/login`, `/signup`, `/forgot-password`, `/reset-password` |
| [src/pages/Submit.tsx](file:///c:/Users/dashr/OneDrive/Desktop/historical%20project/historical-document-conversion-frontend/src/pages/Submit.tsx) | Simulated upload progress timer & local store `submitRequest` | Direct presigned URL uploads to S3 storage + `POST /api/v1/requests` |
| [src/pages/Dashboard.tsx](file:///c:/Users/dashr/OneDrive/Desktop/historical%20project/historical-document-conversion-frontend/src/pages/Dashboard.tsx) | Filtered local `myRequests` from mock store | `GET /api/v1/requests` with backend pagination and status counts |
| [src/pages/RequestDetails.tsx](file:///c:/Users/dashr/OneDrive/Desktop/historical%20project/historical-document-conversion-frontend/src/pages/RequestDetails.tsx) | In-memory request lookup and `downloadMockFile` text blob generator | `GET /api/v1/requests/:id` and secure presigned download link generation |
| [src/pages/Payment.tsx](file:///c:/Users/dashr/OneDrive/Desktop/historical%20project/historical-document-conversion-frontend/src/pages/Payment.tsx) | Simulated timeout payment with demo failure toggle | Razorpay / Stripe SDK modal integration, `POST /api/v1/payments/create-order` & `/verify` |
| [src/pages/Completed.tsx](file:///c:/Users/dashr/OneDrive/Desktop/historical%20project/historical-document-conversion-frontend/src/pages/Completed.tsx) | Mock file download helper `downloadMockFile` | Authenticated presigned download URL for processed output documents |
| [src/pages/Notifications.tsx](file:///c:/Users/dashr/OneDrive/Desktop/historical%20project/historical-document-conversion-frontend/src/pages/Notifications.tsx) | Local state read toggle on `seedNotifications` | `GET /api/v1/notifications`, `PATCH /api/v1/notifications/:id/read`, `POST /api/v1/notifications/mark-all-read` |
| [src/pages/admin/AdminIndex.tsx](file:///c:/Users/dashr/OneDrive/Desktop/historical%20project/historical-document-conversion-frontend/src/pages/admin/AdminIndex.tsx) | In-memory request counting and filtering across `seedRequests` | `GET /api/v1/admin/overview` and `GET /api/v1/admin/requests` with backend filtering |
| [src/pages/admin/AdminRequest.tsx](file:///c:/Users/dashr/OneDrive/Desktop/historical%20project/historical-document-conversion-frontend/src/pages/admin/AdminRequest.tsx) | Store context methods (`sendQuote`, `rejectRequest`, `startProcessing`, `completeRequest`, `setAdminNote`) | `POST /api/v1/admin/requests/:id/quote`, `/reject`, `/start-processing`, `/complete`, `PUT /api/v1/admin/requests/:id/note` |
