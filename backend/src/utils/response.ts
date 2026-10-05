import { Response } from "express";

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export function sendSuccess<T>(res: Response, data: T, message?: string, statusCode = 200): Response {
  const body: ApiResponse<T> = {
    success: true,
    ...(message ? { message } : {}),
    data,
  };
  return res.status(statusCode).json(body);
}

export function sendError(res: Response, error: string, statusCode = 400): Response {
  const body: ApiResponse = {
    success: false,
    error,
  };
  return res.status(statusCode).json(body);
}
