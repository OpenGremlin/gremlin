import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
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
    service: "gremlin-server",
    env: process.env.NODE_ENV || "development",
  },
  serializers: pino.stdSerializers,
});

export type Logger = pino.Logger;
