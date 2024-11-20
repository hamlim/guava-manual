// A generic router for the application
// Takes in a "manifest" of registered pages/routes
// and returns a router that supports route matching

type MatchedRoute =
  | {
      type: "static";
      path: string;
    }
  | {
      // `/foo/[single].page.tsx`
      // matches to `/foo/anything`
      // does not match to `/foo`, or `/foo/anything/else`
      type: "dynamic";
      path: string;
      params: Record<string, string>;
    }
  | {
      // `/foo/[...nested].page.tsx`
      // matches to:
      // - `/foo/anything`
      // - `/foo/anything/else`
      // does not match to `/foo`
      type: "catch-all";
      path: string;
      params: Record<string, Array<string>>;
    };

type Route =
  | { type: "static"; path: string }
  | { type: "dynamic"; params: Array<string>; path: string }
  | { type: "catch-all"; params: Array<string>; path: string };

export type RouteManifest = Array<Route>;

export class Router {
  #manifest: RouteManifest;
  constructor(routeManifest: RouteManifest) {
    this.#manifest = routeManifest;
  }

  match(url: URL): MatchedRoute | undefined {
    let path = url.pathname;

    let pathChunks = path.split("/").filter(Boolean);

    for (const route of this.#manifest) {
      let routePathChunks = route.path.split("/").filter(Boolean);
      if (route.type === "static") {
        if (route.path === path) {
          return route;
        }
      }

      if (route.type === "dynamic") {
        let routePathIdx = 0;
        let requestedPathIdx = 0;

        let matchedParams:
          | Record<string, string>
          | Record<string, Array<string>> = {};

        let matches = true;
        let routeType: "dynamic" | "catch-all" = "dynamic";

        let overflowCount = 1000;

        while (
          routePathIdx < routePathChunks.length ||
          requestedPathIdx < pathChunks.length
        ) {
          if (overflowCount-- < 0) {
            throw new Error("Route matching overflow");
          }
          // static part of the route, increase indexes and continue
          if (routePathChunks[routePathIdx] === pathChunks[requestedPathIdx]) {
            routePathIdx++;
            requestedPathIdx++;
          } else if (routePathChunks[routePathIdx]?.startsWith("[...")) {
            routeType = "catch-all";
            // Nested Dynamic segment
            // If the requested path is present, add it to the matched params
            // and continue
            if (pathChunks[requestedPathIdx] !== undefined) {
              // remove the [... and ]
              let name = routePathChunks[routePathIdx].slice(4, -1);
              matchedParams[name] = pathChunks.slice(requestedPathIdx);
              // break - we don't check deeper than the nested dynamic segment
              break;
            }

            matches = false;
            // If the requested path is not present, break - this branch doesn't match!
            break;
          } else if (routePathChunks[routePathIdx]?.startsWith("[")) {
            routeType = "dynamic";
            // Single Dynamic segment
            // If the requested path is present, add it to the matched params
            // and continue
            if (pathChunks[requestedPathIdx] !== undefined) {
              matchedParams[routePathChunks[routePathIdx].slice(1, -1)] =
                pathChunks[requestedPathIdx];
              routePathIdx++;
              requestedPathIdx++;
            } else {
              // If the requested path is not present, break - this branch doesn't match!
              matches = false;
              break;
            }
          } else {
            // lengths didn't match and there wasn't a catch-all dynamic segment!
            matches = false;
            break;
          }
        }

        if (matches) {
          return {
            type: routeType,
            path: route.path,
            params: matchedParams,
          } as MatchedRoute;
        }
      }
    }
  }
}
