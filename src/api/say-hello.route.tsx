import type { Store } from "guava/types";

export default async function FooRoute(
  _request: Request,
  _context: Store["context"],
) {
  return new Response("Hello World");
}
