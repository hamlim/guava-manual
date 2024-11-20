"use client";

import { useSyncExternalStore } from "react";

// @TODO: hook up to history API
// also listen for popstate events
export class ClientRouter {
  path: string;

  #listeners: Array<(path: string) => void> = [];

  constructor(path: string) {
    this.path = path;
  }

  refresh(path: string): void {
    // TODO: implement
  }

  subscribe(onStoreChange: () => void): () => void {
    this.#listeners.push(onStoreChange);
    return () => {
      this.#listeners = this.#listeners.filter(
        (listener) => listener !== onStoreChange,
      );
    };
  }

  getSnapshot(): ClientRouter {
    return this;
  }
}

let currentPath = "/";
if (typeof window !== "undefined" && window.location) {
  currentPath = window.location.pathname;
}

let router = new ClientRouter(currentPath);

export function useRouter(): ClientRouter {
  return useSyncExternalStore(
    router.subscribe,
    router.getSnapshot,
    router.getSnapshot,
  );
}
