import { exec } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { join as pathJoin } from "node:path";
import { promisify } from "node:util";

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
`);
  process.exit(0);
}

let outDir = pathJoin(process.cwd(), args.outDir || "./dist");

let result = await safely(mkdir(outDir, { recursive: true }));
if (result.status === "rejected") {
  console.error(`Failed to create output directory: ${outDir}`);
  process.exit(1);
}

// collect routes
