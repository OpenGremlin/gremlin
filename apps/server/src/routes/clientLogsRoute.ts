import { createLogger } from "@opengremlin/lib/logger.js";
import type { Request, Response } from "express";

const clientLog = createLogger("admin-client");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
} as const;

export function clientLogsPreflight(_req: Request, res: Response): void {
  res.set(CORS_HEADERS).status(204).end();
}

export function clientLogsRoute(req: Request, res: Response): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { entries } = req.body ?? {};
  if (!Array.isArray(entries)) {
    res.status(400).json({ error: "entries must be an array" });
    return;
  }
  for (const entry of entries.slice(0, 50)) {
    const meta = {
      url: entry.url,
      data: entry.data,
      clientTimestamp: entry.timestamp,
    };
    const msg: string = entry.message ?? "client log";
    if (entry.level === "error") clientLog.error(meta, msg);
    else if (entry.level === "warn") clientLog.warn(meta, msg);
    else if (entry.level === "debug") clientLog.debug(meta, msg);
    else clientLog.info(meta, msg);
  }
  res.status(204).end();
}
