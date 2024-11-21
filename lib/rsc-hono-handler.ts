import type { Context } from "hono";
import type { Router } from "./router";

async function loadEntrypoint(path: string) {
  return import(`./${path}`);
}

// `GET *`
export async function createRSCGetHandler(router: Router) {
  let serverComponentEntrypointManifest = await import(
    "../dist/server-component-entrypoint-manifest.json"
  );

  console.log(serverComponentEntrypointManifest.default);
  return async function rscHandler(c: Context) {
    let matchedRoute = router.match(new URL(c.req.url));
    if (!matchedRoute) {
      // @TODO - expose special 404 handler
      return c.text("Not Found", 404);
    }

    let entrypoint = await loadEntrypoint(matchedRoute.path);

    return c.text("Hello World");
  };
}

// `POST /`
export async function rscActionHandler(c: Context) {
  // @TODO
}
