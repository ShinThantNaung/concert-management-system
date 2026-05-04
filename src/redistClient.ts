import dotenv from "dotenv";
import { createClient } from "redis";

dotenv.config();

export const redisClient = createClient({
    url: process.env.REDIS_URL ?? "",
});

redisClient.on("error", (err) => {
    console.error("Redis error:", err);
});

export const connectRedis = async () => {
    await redisClient.connect();
};