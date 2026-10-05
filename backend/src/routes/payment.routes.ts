import { Router } from "express";
import {
  createOrder,
  verifyPayment,
  handleWebhook,
  getAdminPayments,
  createAdminPayment,
  getRazorpayConfigAdmin,
  saveRazorpayConfig,
} from "../controllers/payment.controller";
import { authenticate, requireRole } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  CreatePaymentOrderSchema,
  VerifyPaymentSchema,
  AdminCreatePaymentSchema,
  AdminRazorpayConfigSchema,
} from "../schemas/payment.schema";
import { Role } from "@prisma/client";

const router = Router();

router.post("/create-order", authenticate, validate(CreatePaymentOrderSchema), createOrder);
router.post("/verify", authenticate, validate(VerifyPaymentSchema), verifyPayment);
router.post("/webhook", handleWebhook);

// Admin Payment Management routes
router.get("/admin/all", authenticate, requireRole(Role.ADMIN), getAdminPayments);
router.post("/admin/manual-create", authenticate, requireRole(Role.ADMIN), validate(AdminCreatePaymentSchema), createAdminPayment);
router.get("/admin/config", authenticate, requireRole(Role.ADMIN), getRazorpayConfigAdmin);
router.post("/admin/config", authenticate, requireRole(Role.ADMIN), validate(AdminRazorpayConfigSchema), saveRazorpayConfig);

export default router;
