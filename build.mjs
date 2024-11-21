import { exec } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { join as pathJoin } from "node:path";
import { promisify } from "node:util";
import glob from "fast-glob";

let execPromise = promisify(exec);

async function safely(promise) {
  return (await Promise.allSettled([promise])).at(0);
}

// parse args
let rawArgs = process.argv.slice(2);

let args = rawArgs
  // trim off leading --
  .map((arg) => {
    if (arg.startsWith("--")) {
      return arg.slice(2);
    }
    return arg;
  })
  .reduce((acc, arg) => {
    if (arg.includes("=")) {
      let [key, value] = arg.split("=");
      acc[key] = value;
    } else {
      acc[arg] = true;
    }
    return acc;
  }, {});

if (args.help) {
  console.log(`
Usage: guava [options]

Options:
  --help                Show help (example: --help)
  --dev                 Run in dev mode (example --dev)
  --out-dir             Output directory (example: --out-dir=./dist)
  --root-dir            Root directory (example: --root-dir=./src)
`);
  process.exit(0);
}

if (args.dev) {
  dev();
} else {
  build();
}

async function dev() {
  await exec(`vite-node -c vite-node.config.ts -w ./src/node-server.tsx`);
}

async function build() {
  let outDir = pathJoin(process.cwd(), args.outDir || "./dist");
  let rootDir = pathJoin(process.cwd(), args.rootDir || "./src");
  let mkdirDistResult = await safely(mkdir(outDir, { recursive: true }));
  if (mkdirDistResult.status === "rejected") {
    console.error(`Failed to create output directory: ${outDir}`);
    process.exit(1);
  }

  // collect routes
  // collect routes from src directory
  let routeFiles = await glob(
    pathJoin(rootDir, "**/*.{route,page}.{ts,tsx,js,jsx}"),
  );

  let routeManifest = new Map(/*<string, Route>*/);

  for (let file of routeFiles) {
    // strip src/ prefix and file extension to get route path
    let routePath = file
      .replace(rootDir, "")
      .replace(/\.(route|page)\.(ts|tsx|js|jsx)$/, "")
      .replace(/\/index$/, "/");

    // check if path contains dynamic segments
    if (routePath.includes("[")) {
      let params = [];
      let pathParts = routePath.split("/");

      for (let part of pathParts) {
        if (part.startsWith("[...")) {
          // catch-all segment
          params.push(part.slice(4, -1));
          routeManifest.set(routePath, {
            type: "catch-all",
            path: routePath,
            params,
          });
          break;
        }
        if (part.startsWith("[")) {
          // dynamic segment
          params.push(part.slice(1, -1));
        }
      }

      if (!routeManifest.has(routePath)) {
        routeManifest.set(routePath, {
          type: "dynamic",
          path: routePath,
          params,
        });
      }
    } else {
      routeManifest.set(routePath, {
        type: "static",
        path: routePath,
      });
    }
  }

  let writeRouteManifestResult = await safely(
    writeFile(
      pathJoin(outDir, "route-manifest.json"),
      JSON.stringify([...routeManifest.values()]),
    ),
  );
  if (writeRouteManifestResult.status === "rejected") {
    console.error(
      `Failed to write route manifest: ${pathJoin(outDir, "route-manifest.json")}`,
    );
    console.error(writeRouteManifestResult.reason);
    console.error(
      `Route Manifest: ${JSON.stringify([...routeManifest.values()])}`,
    );
    process.exit(1);
  }
}
