import { Router } from "express";
import { getPresignedUploadUrl, uploadFile, downloadFile } from "../controllers/file.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/presigned-url", authenticate, getPresignedUploadUrl);
router.post("/upload", uploadFile);
router.get("/download/:fileKey(*)", authenticate, downloadFile);

export default router;
