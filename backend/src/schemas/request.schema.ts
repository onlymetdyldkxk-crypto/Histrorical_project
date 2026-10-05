import { z } from "zod";
import { DocType, SourceKind } from "@prisma/client";

export const CreateRequestSchema = z.object({
  document: z.object({
    kind: z.nativeEnum(SourceKind),
    fileName: z.string().min(1, "File name is required"),
    fileType: z.nativeEnum(DocType),
    fileSize: z.number().optional(),
    fileCount: z.number().optional(),
    driveUrl: z.string().optional(),
    storageKey: z.string().optional(),
  }),
  requirements: z.object({
    fullName: z.string().min(1, "Full name is required"),
    age: z.string().optional(),
    gender: z.string().optional(),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    address: z.string().optional(),
    purpose: z.string().min(5, "Purpose description is required"),
    processing: z.string().min(5, "Processing details are required"),
    outputFormat: z.string().min(1, "Output format is required"),
    instructions: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export type CreateRequestInput = z.infer<typeof CreateRequestSchema>;
