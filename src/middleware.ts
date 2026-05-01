import type { Request, Response } from "express";
import * as crypto from "crypto";
import { asyncLocalStorage } from "./context.ts";

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

const checkId = (req: Request, res: Response, next: () => void) => {
  let correlationId = req.header("X-Correlation-Id");
  if (!correlationId) {
    correlationId = crypto.randomUUID();
    res.setHeader("X-Correlation-Id", correlationId);
    req.correlationId = correlationId;
    return;
  }
  asyncLocalStorage.run({ correlationId }, () => {
    req.correlationId = correlationId;
    next();
  });
};
export default checkId;
