import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { sendError } from "../utils/response";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const firstIssue = error.issues[0];
        const errorMsg = firstIssue ? `${firstIssue.path.join(".")}: ${firstIssue.message}` : "Validation failed";
        sendError(res, errorMsg, 400);
        return;
      }
      sendError(res, "Invalid request payload", 400);
    }
  };
}
