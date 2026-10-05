import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import apiV1 from "./routes";
import { sendError } from "./utils/response";

const app = express();

// Security HTTP headers
app.use(helmet());

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const allowedOrigins = (env.CORS_ORIGIN || "*")
        .split(",")
        .map((o) => o.trim());

      if (
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(origin) ||
        origin.endsWith(".trycloudflare.com") ||
        origin.endsWith(".loca.lt") ||
        origin.startsWith("http://localhost:")
      ) {
        return callback(null, true);
      }

      return callback(null, true);
    },
    credentials: true,
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // max 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests. Please try again later." },
});
app.use(limiter);

// Body Parsers
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Mount API Routes
app.use("/api/v1", apiV1);

// Root Status Page
app.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "Historical Document Conversion System API",
    status: "running",
    documentation: "/api/v1/health",
  });
});

// 404 Route Handler
app.use((_req: Request, res: Response) => {
  sendError(res, "Endpoint not found", 404);
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled Error:", err);
  sendError(res, err.message || "Internal server error", 500);
});

export default app;
