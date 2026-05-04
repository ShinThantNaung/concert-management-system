import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { HttpError } from "../errors/HttpError.ts";

export const validate =
  <TSchema extends ZodType>(schema: TSchema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      const issues = parsed.error.issues.map((issue) => issue.message);
      const message = issues[0] ?? "Invalid request payload.";
      next(new HttpError(400, message, "ERR_400"));
      return;
    }

    req.body = parsed.data;
    next();
  };
