import pino from "pino";
import fs from "fs";
import path from "path";
import { asyncLocalStorage } from "./context.ts";

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "app.log");

try {
  fs.mkdirSync(LOG_DIR, { recursive: true });
} catch (error) {
  console.error("Failed to create log directory:", error);
}

const destination = pino.destination({ dest: LOG_FILE, sync: false });

export const logger = pino(
  {
    level: process.env.LOG_LEVEL ?? "info",
    timestamp: pino.stdTimeFunctions.isoTime,
    mixin() {
      const store = asyncLocalStorage.getStore();

      return {
        correlationId: store?.correlationId,
      };
    },
  },
  destination,
);
