// rateLimiter.ts
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redisClient } from "./redistClient.ts";

export const reserveLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,

  standardHeaders: true,
  legacyHeaders: false,

  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),

  message: {
    error: "RATE_LIMIT_EXCEEDED",
    message: "Too many reservation attempts. Try again later.",
  },
});