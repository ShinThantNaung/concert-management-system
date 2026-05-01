import pino from "pino";
import { asyncLocalStorage } from "./context.ts";

export const logger = pino({
  mixin() {
    const store = asyncLocalStorage.getStore();

    return {
      correlationId: store?.correlationId,
    };
  },
});