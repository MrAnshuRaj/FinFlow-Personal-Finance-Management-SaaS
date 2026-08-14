import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/errors";
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) return res.status(422).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Please check the highlighted fields", details: err.flatten() } });
  if (err instanceof AppError) return res.status(err.status).json({ success: false, error: { code: err.code, message: err.message } });
  if (err?.code === "P2002") return res.status(409).json({ success: false, error: { code: "DUPLICATE_RESOURCE", message: "That record already exists" } });
  console.error("Request failed", { message: err instanceof Error ? err.message : "Unknown error" });
  return res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." } });
};
