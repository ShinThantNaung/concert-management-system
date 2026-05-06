import express, { type Request, type Response } from "express";
import { router } from "./routes.ts";
import dotenv from "dotenv";
import { errorHandler } from "./middleware/errorHandler.ts";
import { attachCorrelationId } from "./middleware/correlation.ts";
import { swaggerSpec } from "./config.ts";

dotenv.config();

const port = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(attachCorrelationId);
app.use("/api", router);
app.use("/api-docs", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});
app.use(errorHandler);

app.get("/", (req: Request, res: Response) => {
  res.send("API service is healthy and running!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
