import { AsyncLocalStorage } from "node:async_hooks";
import type { Store } from "./types";

export let asyncLocalStorage = new AsyncLocalStorage<Store>();

export function getStore(): Store {
  let store = asyncLocalStorage.getStore();
  if (!store) {
    throw new Error("No store found");
  }
  return store;
}

export function run(store: Store, cb: () => void): void {
  asyncLocalStorage.run(store, cb);
}
