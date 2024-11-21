import type { Context } from "hono";
import type { Router } from "./router";

async function loadEntrypoint(path: string) {
  return import(path);
}

// `GET *`
export async function createRSCGetHandler(router: Router) {
  return async function rscHandler(c: Context) {
    let matchedRoute = router.match(new URL(c.req.url));
    if (!matchedRoute) {
      // @TODO - expose special 404 handler
      return c.text("Not Found", 404);
    }

    let entrypoint = await loadEntrypoint(matchedRoute.path);
  };
}

// `POST /`
export async function rscActionHandler(c: Context) {
  // @TODO
}
