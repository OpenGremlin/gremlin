import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export function createLogger(component: string): pino.Logger {
  return baseLogger.child({ component });
}

const baseLogger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss.l" },
        },
      }),
  base: {
    service: "gremlin-sandbox",
    env: process.env.NODE_ENV || "development",
  },
  serializers: pino.stdSerializers,
});

export const logger = baseLogger;

export type Logger = pino.Logger;
