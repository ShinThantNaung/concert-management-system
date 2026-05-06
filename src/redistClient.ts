import dotenv from "dotenv";
import { createClient } from "redis";

dotenv.config();

export const redisClient = createClient({
  url: process.env.REDIS_URL ?? "",
});

redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});

let connectPromise: Promise<void> | null = null;

export const ensureRedisConnected = async () => {
  if (redisClient.isReady) {
    return;
  }

  if (!connectPromise) {
    connectPromise = redisClient.connect();
  }

  await connectPromise;
};

export const connectRedis = async () => {
  await ensureRedisConnected();
};
