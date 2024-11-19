import { describe, expect, it } from "bun:test";
import { Router } from "../router";

describe("Router", () => {
  it("should match static routes", () => {
    let router = new Router([{ type: "static", path: "/foo" }]);

    let requestedURL = new URL("/foo", "http://localhost");
    let matchedRoute = router.match(requestedURL);

    expect(matchedRoute).toEqual({ type: "static", path: "/foo" });

    let requestedURL2 = new URL("/foo/anything", "http://localhost");
    let matchedRoute2 = router.match(requestedURL2);

    expect(matchedRoute2).toBeUndefined();
  });

  it("should match dynamic routes", () => {
    let router = new Router([
      {
        type: "dynamic",
        params: [{ type: "single", value: "single" }],
        path: "/foo/[single]",
      },
    ]);

    let requestedURL = new URL("/foo/anything", "http://localhost");
    let matchedRoute = router.match(requestedURL);

    expect(matchedRoute).toEqual({
      type: "dynamic",
      path: "/foo/[single]",
      params: { single: "anything" },
    });

    let requestedURL2 = new URL("/foo/anything/else", "http://localhost");
    let matchedRoute2 = router.match(requestedURL2);

    expect(matchedRoute2).toBeUndefined();
  });

  it("should match many dynamic routes", () => {
    let router = new Router([
      {
        type: "dynamic",
        params: [{ type: "single", value: "id" }],
        path: "/foo/[id]/bar",
      },
    ]);

    let requestedURL = new URL("/foo/anything/bar", "http://localhost");
    let matchedRoute = router.match(requestedURL);

    expect(matchedRoute).toEqual({
      type: "dynamic",
      path: "/foo/[id]/bar",
      params: { id: "anything" },
    });
  });

  it("should match nested dynamic routes", () => {
    let router = new Router([
      {
        type: "dynamic",
        params: [{ type: "nested", value: "nested" }],
        path: "/foo/[...nested]",
      },
    ]);

    let requestedURL = new URL("/foo/anything", "http://localhost");
    let matchedRoute = router.match(requestedURL);

    expect(matchedRoute).toEqual({
      type: "dynamic",
      path: "/foo/[...nested]",
      params: { nested: ["anything"] },
    });

    let requestedURL2 = new URL("/foo/anything/else", "http://localhost");
    let matchedRoute2 = router.match(requestedURL2);

    expect(matchedRoute2).toEqual({
      type: "dynamic",
      path: "/foo/[...nested]",
      params: { nested: ["anything", "else"] },
    });
  });
});
