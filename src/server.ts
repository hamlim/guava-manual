import { Hono } from "hono";
import { createRSCGetHandler } from "lib/rsc-hono-handler";
import { getStore } from "../lib/async-local-storage";
import { createALSMiddleware } from "../lib/hono-async-local-storage-middleware";
import { type RouteManifest, Router } from "../lib/router";

const app = new Hono();

let routes = await import("../dist/route-manifest.json");

let router = new Router(routes.default as RouteManifest);

app.use(createALSMiddleware(router));

app.get("*", await createRSCGetHandler(router));

app.get("/", async (c) => {
  let store = getStore();
  console.log(store);
  return c.text("Hello World");
});

app.get("/:scope/baz", async (c) => {
  let store = getStore();
  console.log(store);
  return c.text(`scope ${store.context.params.scope}`);
});

app.get("/:id", async (c) => {
  let store = getStore();
  console.log(store);
  return c.text(`id ${store.context.params.id}`);
});

export default app;
