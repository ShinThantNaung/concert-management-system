import express, { type Request, type Response } from "express";
import { router } from "./routes.ts";
import dotenv from "dotenv";
import { errorHandler } from "./middleware/errorHandler.ts";
import { attachCorrelationId } from "./middleware/correlation.ts";
import { swaggerSpec } from "./config.ts";
import { connectRedis } from "./redistClient.ts";
import swaggerUi from "swagger-ui-express";

dotenv.config();

const port = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(attachCorrelationId);
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

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

void startServer();
