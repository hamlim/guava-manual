import { useSyncExternalStore } from "react";

class ClientRouter {
  path: string;
  constructor(path: string) {
    this.path = path;
  }

  refresh(path: string): void {
    // TODO: implement
  }

  subscribe(onStoreChange: () => void): () => void {
    // TODO: implement
    return () => {};
  }

  unsubscribe(unsubscribe: () => void): void {
    // TODO: implement
  }
}

export function useRouter() {
  return useSyncExternalStore(
    () => {},
    () => {},
    () => {},
  );
}
