import { Router } from "express";
import { createRequest, getUserRequests, getRequestById, getQuoteByRequestId } from "../controllers/request.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { CreateRequestSchema } from "../schemas/request.schema";

const router = Router();

router.post("/", authenticate, validate(CreateRequestSchema), createRequest);
router.get("/", authenticate, getUserRequests);
router.get("/:id", authenticate, getRequestById);
router.get("/:id/quote", authenticate, getQuoteByRequestId);

export default router;
