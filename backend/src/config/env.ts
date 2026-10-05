import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("5000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().default("postgresql://user:password@localhost:5432/historical_doc_db?schema=public"),
  JWT_SECRET: z.string().default("fallback_jwt_secret_for_development_mode_only"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),

  STORAGE_PROVIDER: z.enum(["mock", "s3", "r2"]).default("mock"),
  STORAGE_BUCKET_NAME: z.string().default("historical-doc-archive"),
  STORAGE_REGION: z.string().default("ap-south-1"),
  STORAGE_ACCESS_KEY: z.string().optional().default("mock_access_key"),
  STORAGE_SECRET_KEY: z.string().optional().default("mock_secret_key"),

  PAYMENT_GATEWAY: z.enum(["mock", "razorpay", "stripe"]).default("mock"),
  PAYMENT_KEY_ID: z.string().optional().default("mock_payment_key_id"),
  PAYMENT_KEY_SECRET: z.string().optional().default("mock_payment_key_secret"),
  PAYMENT_WEBHOOK_SECRET: z.string().optional().default("mock_webhook_secret"),
});

export const env = envSchema.parse(process.env);
