import { writeFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join as pathJoin } from "node:path";
import { serve } from "@hono/node-server";
import { Hono } from "hono";

let app = new Hono();

let rawArgs = process.argv.slice(2);
let args = rawArgs.reduce((acc, rawArg) => {
  let arg = rawArg;
  if (arg.startsWith("--")) {
    arg = arg.slice(2);
  }
  if (arg.includes("=")) {
    let [key, value] = arg.split("=");
    acc[key] = value;
  } else {
    acc[arg] = true;
  }
  return acc;
}, {});

let { rootDir, outDir } = args;

if (!rootDir || !outDir) {
  console.error("rootDir and outDir are required");
  process.exit(1);
}

class Logger {
  logFile = pathJoin(process.cwd(), ".guava/guava.log");
  initalized = false;
  async init() {
    let result = await safely(
      mkdir(pathJoin(process.cwd(), ".guava"), { recursive: true }),
    );
    if (result.status === "rejected") {
      throw new Error(`Couldn't create .guava dir!`);
    }
    let fileResult = await safely(writeFile(this.logFile, "", { flag: "w" }));
    if (fileResult.status === "rejected") {
      throw new Error(`Couldn't create guava.log file!`);
    }
    this.initalized = true;
  }

  doLog(level, ...args) {
    if (!this.initalized) {
      console.warn(`Logger not initalized!`);
      return;
    }
    // append to log file
    writeFileSync(
      this.logFile,
      `\n${JSON.stringify({ date: new Date().toISOString(), level, message: args })}`,
      {
        flag: "a",
      },
    );
  }

  warn(...args) {
    this.doLog("warn", ...args);
  }
  error(...args) {
    this.doLog("error", ...args);
  }
  info(...args) {
    this.doLog("info", ...args);
  }
}

let logger = new Logger();

await logger.init();

async function safely(promise) {
  return (await Promise.allSettled([promise])).at(0);
}

async function loadConfig() {
  let result = await safely(
    readFile(pathJoin(process.cwd(), "guava.config.mjs"), "utf8"),
  );
  if (result.status === "rejected") {
    logger.warn("Failed to load config");
  }
  return result.value ?? {};
}

app.get("/config", async (c) => {
  let config = await loadConfig();
  return c.json({
    rootDir,
    outDir,
    ...config,
  });
});

app.get("/shutdown", () => {
  logger.info("Shutting down dev server");
  process.exit(0);
});

serve(
  {
    fetch: app.fetch,
    port: 42069,
  },
  (info) => {
    logger.info(`Dev server running on port ${info.port}`);
  },
);
