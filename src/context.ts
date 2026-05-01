import { AsyncLocalStorage } from "async_hooks";

type Store = {
  correlationId: string;
};

export const asyncLocalStorage = new AsyncLocalStorage<Store>();