import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export function createLogger(service: string): pino.Logger {
  return pino({
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
      service,
      env: process.env.NODE_ENV || "development",
    },
    serializers: pino.stdSerializers,
  });
}

export const logger = createLogger("gremlin-server");

export type Logger = pino.Logger;
