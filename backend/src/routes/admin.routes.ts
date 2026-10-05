import { Router } from "express";
import {
  getOverview,
  getAllRequests,
  getAdminRequestById,
  saveAdminNote,
  sendQuote,
  rejectRequest,
  startProcessing,
  completeRequest,
} from "../controllers/admin.controller";
import { authenticate, requireRole } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { SendQuoteSchema, RejectRequestSchema, AdminNoteSchema, CompleteRequestSchema } from "../schemas/admin.schema";
import { Role } from "@prisma/client";

const router = Router();

// Protect all admin endpoints with authentication & admin role guard
router.use(authenticate, requireRole(Role.ADMIN));

router.get("/overview", getOverview);
router.get("/requests", getAllRequests);
router.get("/requests/:id", getAdminRequestById);
router.put("/requests/:id/note", validate(AdminNoteSchema), saveAdminNote);
router.post("/requests/:id/quote", validate(SendQuoteSchema), sendQuote);
router.post("/requests/:id/reject", validate(RejectRequestSchema), rejectRequest);
router.post("/requests/:id/start-processing", startProcessing);
router.post("/requests/:id/complete", validate(CompleteRequestSchema), completeRequest);

export default router;
