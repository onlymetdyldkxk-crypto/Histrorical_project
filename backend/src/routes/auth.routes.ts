import { Router } from "express";
import { signup, login, logout, forgotPassword, resetPassword, me } from "../controllers/auth.controller";
import { validate } from "../middleware/validate.middleware";
import { authenticate } from "../middleware/auth.middleware";
import { SignupSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema } from "../schemas/auth.schema";

const router = Router();

router.post("/signup", validate(SignupSchema), signup);
router.post("/login", validate(LoginSchema), login);
router.post("/logout", logout);
router.post("/forgot-password", validate(ForgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(ResetPasswordSchema), resetPassword);
router.get("/me", authenticate, me);

export default router;
