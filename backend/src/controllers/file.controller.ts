import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

export async function getPresignedUploadUrl(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { fileName } = req.body;
    const fileKey = `uploads/${Date.now()}-${fileName || "document"}`;
    
    sendSuccess(res, {
      uploadUrl: `/api/v1/files/upload?key=${encodeURIComponent(fileKey)}`,
      fileKey,
      expiresIn: 3600,
    });
  } catch (err: any) {
    sendError(res, err.message || "Failed to generate presigned upload URL", 500);
  }
}

export async function uploadFile(req: Request, res: Response): Promise<void> {
  try {
    const key = (req.query.key as string) || `uploads/${Date.now()}-doc`;
    sendSuccess(res, { key }, "File uploaded successfully");
  } catch (err: any) {
    sendError(res, err.message || "Upload failed", 500);
  }
}

export async function downloadFile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const fileKey = (req.params.fileKey || "") as string;
    const fileName = Array.isArray(fileKey) ? fileKey[0] : fileKey;
    
    res.setHeader("Content-Disposition", `attachment; filename="${fileName.split("/").pop() || "document.pdf"}"`);
    res.setHeader("Content-Type", "application/pdf");
    res.send(Buffer.from("%PDF-1.4 Historical Document Conversion Output Demo"));
  } catch (err: any) {
    sendError(res, err.message || "Download failed", 500);
  }
}
