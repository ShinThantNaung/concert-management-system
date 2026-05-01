import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../errors/HttpError.ts";

export const validateReservation = (req: Request, _res: Response, next: NextFunction) => {
  const userId = Number(req.body?.userId);
  const concertId = Number(req.body?.concertId);

  if (!Number.isFinite(userId) || !Number.isFinite(concertId)) {
    throw new HttpError(400, "userId and concertId are required and must be numbers.");
  }

  next();
};
