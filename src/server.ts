import { Hono } from "hono";
import { getStore } from "../lib/async-local-storage";
import { createALSMiddleware } from "../lib/hono-async-local-storage-middleware";
import { Router } from "../lib/router";

const app = new Hono();

let router = new Router([
  {
    path: "/",
    type: "static",
  },
  {
    path: "/[id]",
    type: "dynamic",
    params: ["id"],
  },
  {
    path: "/[scope]/baz",
    type: "dynamic",
    params: ["scope"],
  },
]);

app.use(createALSMiddleware(router));

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
