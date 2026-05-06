import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { ensureRedisConnected, redisClient } from "./redistClient.ts";

export const reserveLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,

  standardHeaders: true,
  legacyHeaders: false,

  store: new RedisStore({
    sendCommand: async (...args: string[]) => {
      await ensureRedisConnected();
      return redisClient.sendCommand(args);
    },
  }),

  message: {
    error: "RATE_LIMIT_EXCEEDED",
    message: "Too many reservation attempts. Try again later.",
  },
});
