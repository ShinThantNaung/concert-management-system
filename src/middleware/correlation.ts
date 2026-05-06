import { randomUUID } from "crypto";
import type { Request, Response, NextFunction } from "express";
import { asyncLocalStorage } from "../context.ts";

export const attachCorrelationId = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const headerId =
    req.header("x-correlation-id") || req.header("X-Correlation-ID");
  const id =
    headerId ??
    (typeof randomUUID === "function"
      ? randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  res.setHeader("X-Correlation-ID", id);
  asyncLocalStorage.run({ correlationId: id }, () => {
    (req as any).correlationId = id;
    next();
  });
};
