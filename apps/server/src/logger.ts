import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pino from "pino";
import type { TransportTargetOptions } from "pino";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === "production";
const enableFileLogs = process.env.ENABLE_FILE_LOGS === "true";

function getLogFilePath(app: string): string {
  const now = new Date();
  const hour = now.toISOString().slice(0, 13); // "2026-03-06T14"
  const dir = resolve(__dirname, "../../../logs", app);
  mkdirSync(dir, { recursive: true });
  return join(dir, `${hour}.log`);
}

export function createLogger(service: string): pino.Logger {
  const targets: TransportTargetOptions[] = [];

  if (isProduction) {
    targets.push({ target: "pino/file", options: { destination: 1 } });
  } else {
    targets.push({
      target: "pino-pretty",
      options: { colorize: true, translateTime: "HH:MM:ss.l" },
    });
  }

  if (enableFileLogs) {
    targets.push({
      target: "pino/file",
      options: { destination: getLogFilePath("server") },
    });
  }

  return pino({
    level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
    transport: { targets },
    base: {
      service,
      env: process.env.NODE_ENV || "development",
    },
    serializers: pino.stdSerializers,
  });
}

export const logger = createLogger("gremlin-server");

export type Logger = pino.Logger;
