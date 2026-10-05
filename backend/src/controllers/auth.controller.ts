import { Request, Response } from "express";
import { prisma } from "../config/database";
import { hashPassword, comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { sendSuccess, sendError } from "../utils/response";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { SignupInput, LoginInput, ForgotPasswordInput, ResetPasswordInput } from "../schemas/auth.schema";

export async function signup(req: Request<{}, {}, SignupInput>, res: Response): Promise<void> {
  try {
    const { name, email, password, phone } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      sendError(res, "An account with this email already exists.", 400);
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone,
        role: "USER",
      },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    sendSuccess(
      res,
      {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role.toLowerCase(),
          phone: user.phone,
        },
      },
      "Account registered successfully",
      201
    );
  } catch (err: any) {
    sendError(res, err.message || "Failed to register account", 500);
  }
}

export async function login(req: Request<{}, {}, LoginInput>, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      sendError(res, "Invalid email or password.", 401);
      return;
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      sendError(res, "Invalid email or password.", 401);
      return;
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    sendSuccess(
      res,
      {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role.toLowerCase(),
          phone: user.phone,
        },
      },
      "Login successful"
    );
  } catch (err: any) {
    sendError(res, err.message || "Login failed", 500);
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, null, "Logout successful");
}

export async function forgotPassword(req: Request<{}, {}, ForgotPasswordInput>, res: Response): Promise<void> {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return positive response to prevent user enumeration
      sendSuccess(res, null, "If an account exists with that email, a password reset link has been dispatched.");
      return;
    }

    // In a production environment, send email with reset token link.
    sendSuccess(res, { resetToken: `demo-reset-token-${user.id}` }, "Password reset instructions dispatched.");
  } catch (err: any) {
    sendError(res, err.message || "Failed to initiate password reset", 500);
  }
}

export async function resetPassword(req: Request<{}, {}, ResetPasswordInput>, res: Response): Promise<void> {
  try {
    const { token, newPassword } = req.body;
    const userId = token.replace("demo-reset-token-", "");
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      sendError(res, "Invalid or expired password reset token.", 400);
      return;
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    sendSuccess(res, null, "Password reset successfully. You can now log in.");
  } catch (err: any) {
    sendError(res, err.message || "Failed to reset password", 500);
  }
}

export async function me(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) {
      sendError(res, "User profile not found", 404);
      return;
    }

    sendSuccess(res, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.toLowerCase(),
        phone: user.phone,
      },
    });
  } catch (err: any) {
    sendError(res, err.message || "Failed to fetch user session", 500);
  }
}
