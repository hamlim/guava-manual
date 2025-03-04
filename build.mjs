import { exec } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join as pathJoin } from "node:path";
import { promisify } from "node:util";
import glob from "fast-glob";
import oxc from "oxc-transform";

let execPromise = promisify(exec);

async function safely(promise) {
  return (await Promise.allSettled([promise])).at(0);
}

// parse args
let rawArgs = process.argv.slice(2);

let args = rawArgs.reduce((acc, rawArg) => {
  let arg = rawArg;
  // trim off leading --
  if (rawArg.startsWith("--")) {
    arg = rawArg.slice(2);
  }
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

let outDir = pathJoin(process.cwd(), args.outDir || "./dist");
let rootDir = pathJoin(process.cwd(), args.rootDir || "./src");

// @NOTE: Do I need to do this?
// if (args.dev) {
//   // @TODO: support bun and deno as well
//   let runtime = "node";

//   let isDevServerRunning = false;

//   // check if dev server is running
//   let result = await safely(fetch("http://127.0.0.1:42069/config"));
//   if (result.status === "fulfilled") {
//     let res = result.value;
//     if (!res.ok || res.status !== 200) {
//       isDevServerRunning = false;
//     } else {
//       isDevServerRunning = true;
//     }
//   } else {
//     isDevServerRunning = false;
//   }

//   if (!isDevServerRunning) {
//     await execPromise(
//       `${runtime} ${pathJoin(process.cwd(), "dev-server.mjs")} --outDir=${outDir} --rootDir=${rootDir}`,
//     );
//   }
// }

if (existsSync(outDir)) {
  await rm(outDir, { recursive: true });
}

let mkdirDistResult = await safely(mkdir(outDir, { recursive: true }));
if (mkdirDistResult.status === "rejected") {
  console.error(`Failed to create output directory: ${outDir}`);
  process.exit(1);
}

// collect routes
// collect routes from src directory
let routeFileResult = await safely(
  glob(pathJoin(rootDir, "**/*.{route,page}.{ts,tsx,js,jsx}")),
);
if (routeFileResult.status === "rejected") {
  console.error(`Failed to collect route files: ${rootDir}`);
  console.error(routeFileResult.reason);
  process.exit(1);
}
let routeFiles = routeFileResult.value;

let routeManifest = new Map(/*<string, Route>*/);
let serverComponentEntrypointManifest = new Map(
  /*<string, { route: Route, distPath: string }>*/
);

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
        serverComponentEntrypointManifest.set(routePath, {
          route: routeManifest.get(routePath),
          distPath: pathJoin(
            outDir,
            file.replace(rootDir, "").replace(/\.(ts|tsx|js|jsx)$/, ".js"),
          ).replace(process.cwd(), "."),
          srcPath: file.replace(process.cwd(), "."),
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
      serverComponentEntrypointManifest.set(routePath, {
        route: routeManifest.get(routePath),
        distPath: pathJoin(
          outDir,
          file.replace(rootDir, "").replace(/\.(ts|tsx|js|jsx)$/, ".js"),
        ).replace(process.cwd(), "."),
        srcPath: file.replace(process.cwd(), "."),
      });
    }
  } else {
    routeManifest.set(routePath, {
      type: "static",
      path: routePath,
    });
    serverComponentEntrypointManifest.set(routePath, {
      route: routeManifest.get(routePath),
      distPath: pathJoin(
        outDir,
        file.replace(rootDir, "").replace(/\.(ts|tsx|js|jsx)$/, ".js"),
      ).replace(process.cwd(), "."),
      srcPath: file.replace(process.cwd(), "."),
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

// Write server component entrypoint manifest

let serverComponentEntrypoints = [
  ...serverComponentEntrypointManifest.values(),
];

let writeServerComponentEntrypointManifestResult = await safely(
  writeFile(
    pathJoin(outDir, "server-component-entrypoint-manifest.json"),
    JSON.stringify(serverComponentEntrypoints),
  ),
);
if (writeServerComponentEntrypointManifestResult.status === "rejected") {
  console.error(
    `Failed to write server component entrypoint manifest: ${pathJoin(outDir, "server-component-entrypoint-manifest.json")}`,
  );
  console.error(writeServerComponentEntrypointManifestResult.reason);
  process.exit(1);
}

// Do build

let allFilesResult = await safely(
  glob(pathJoin(rootDir, "**/*.{ts,tsx,js,jsx}")),
);
if (allFilesResult.status === "rejected") {
  console.error(`Failed to collect all files: ${rootDir}`);
  console.error(allFilesResult.reason);
  process.exit(1);
}

let allFiles = allFilesResult.value;

for (let srcFile of allFiles) {
  let distPath = srcFile
    .replace(rootDir, outDir)
    .replace(process.cwd(), ".")
    // replace tsx/jsx/ts extensions with js
    .replace(/\.(tsx|ts)/, ".js");

  let distDir = dirname(distPath);

  let mkdirDistDirResult = await safely(mkdir(distDir, { recursive: true }));
  if (mkdirDistDirResult.status === "rejected") {
    console.error(`Failed to create dist directory: ${distDir}`);
    console.error(mkdirDistDirResult.reason);
    process.exit(1);
  }

  let sourceFileResult = await safely(readFile(srcFile, "utf-8"));
  if (sourceFileResult.status === "rejected") {
    console.error(`Failed to read source file: ${srcFile}`);
    console.error(sourceFileResult.reason);
    process.exit(1);
  }

  let sourceFile = sourceFileResult.value;

  let { code, errors } = oxc.transform(srcFile, sourceFile);

  let distResult = await safely(writeFile(distPath, code));
  if (distResult.status === "rejected") {
    console.error(`Failed to write dist file: ${distPath}`);
    console.error(errors);
    console.error(distResult.reason);
    process.exit(1);
  }
}
