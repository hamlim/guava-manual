import type { Context, Next } from "hono";
import { asyncLocalStorage } from "./async-local-storage";
import type { Router } from "./router";
import type { Store } from "./types";

export function createALSMiddleware(router: Router) {
  return async function asyncLocalStorageMiddleware(
    context: Context,
    next: Next,
  ) {
    let url = new URL(context.req.url);
    let route = router.match(url);

    let params: Record<string, string | string[]> = {};

    if (route && (route.type === "dynamic" || route.type === "catch-all")) {
      params = route.params;
    }

    let store: Store = {
      request: context.req.raw,
      context: {
        params,
        status: (status) =>
          context.status(status as Parameters<Context["status"]>[0]),
      },
    };

    await asyncLocalStorage.run(store, async () => await next());
  };
}
