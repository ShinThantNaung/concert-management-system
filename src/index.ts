import express, { type Request, type Response } from "express";
import { router } from "./routes.ts";
import dotenv from "dotenv";
import { errorHandler } from "./middleware/errorHandler.ts";
import { attachCorrelationId } from "./middleware/correlation.ts";
import { swaggerSpec } from "./config.ts";
import { connectRedis, redisClient } from "./redistClient.ts";
import { AppDataSource } from "./config.ts";
import { setupGracefulShutdown } from "./shutdown.ts";
import swaggerUi from "swagger-ui-express";
import { logger } from "./logger.ts";

dotenv.config();

const port = process.env.PORT || 3000;

const app = express();

app.use(attachCorrelationId);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, _res, next) => {
  logger.info(
    {
      event: "request_received",
      method: req.method,
      path: req.originalUrl,
    },
    "Request received",
  );
  next();
});
app.use("/api", router);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(errorHandler);

app.get("/", (req: Request, res: Response) => {
  res.send("API service is healthy and running!");
});

const startServer = async () => {
  try {
    if (!process.env.REDIS_URL) {
      throw new Error("REDIS_URL is not set");
    }
    await connectRedis();
    console.log("Redis client connected");
  } catch (error) {
    console.error("Failed to connect Redis:", error);
    process.exit(1);
  }

  const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

  setupGracefulShutdown({
    server,
    dataSource: AppDataSource,
    redisClient,
  });
};

void startServer();
