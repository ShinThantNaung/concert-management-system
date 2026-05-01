import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../errors/HttpError.ts";
import fs from "fs";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "errors.log");

const ensureLogDir = () => {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch (e) {}
};

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const correlationId =
    (req as any).correlationId ??
    req.header("x-correlation-id") ??
    req.header("X-Correlation-ID");
  const id =
    correlationId ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const timestamp = new Date().toISOString();
  const stack = err instanceof Error ? (err.stack ?? err.message) : String(err);
  const logEntry = `${timestamp} [${id}] ${stack}\n\n`;

  try {
    ensureLogDir();
    fs.appendFileSync(LOG_FILE, logEntry, { encoding: "utf8" });
  } catch (e) {
    console.error("Failed to write error log:", e);
  }

  console.error(logEntry);

  if (err instanceof HttpError) {
    const payload = {
      error: err.code ?? `ERR_${err.status}`,
      message: err.message ?? "Error",
      ref: id,
    };
    res.status(err.status).json(payload);
    return;
  }

  res.status(500).json({
    error: "INTERNAL_ERROR",
    message: "Internal Server Error",
    ref: id,
  });
};
