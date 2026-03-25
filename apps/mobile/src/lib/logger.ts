import { AppState, Platform } from "react-native";
import { getApiUrl } from "./config";

type LogLevel = "error" | "warn" | "info" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
  platform: string;
}

const FLUSH_INTERVAL_MS = 5_000;
const MAX_BATCH_SIZE = 50;

const buffer: LogEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let _getToken: (() => Promise<string | null>) | null = null;

/** Called once at startup to wire in the token provider without a circular import. */
export function setLoggerTokenProvider(fn: () => Promise<string | null>) {
  _getToken = fn;
}

function flush() {
  if (buffer.length === 0) return;
  const batch = buffer.splice(0, MAX_BATCH_SIZE);
  const API_URL = getApiUrl();

  const tokenPromise = _getToken ? _getToken() : Promise.resolve(null);
  tokenPromise.then((token) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    fetch(`${API_URL}/api/client-logs`, {
      method: "POST",
      headers,
      body: JSON.stringify({ entries: batch }),
    }).catch(() => {
      // Silently drop
    });
  });
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, FLUSH_INTERVAL_MS);
}

function log(level: LogLevel, message: string, data?: Record<string, unknown>) {
  buffer.push({
    level,
    message,
    data,
    timestamp: new Date().toISOString(),
    platform: Platform.OS,
  });

  if (level === "error" || buffer.length >= MAX_BATCH_SIZE) {
    flush();
  } else {
    scheduleFlush();
  }
}

export const clientLogger = {
  error: (message: string, data?: Record<string, unknown>) =>
    log("error", message, data),
  warn: (message: string, data?: Record<string, unknown>) =>
    log("warn", message, data),
  info: (message: string, data?: Record<string, unknown>) =>
    log("info", message, data),
  debug: (message: string, data?: Record<string, unknown>) =>
    log("debug", message, data),
};

// Flush when app goes to background
AppState.addEventListener("change", (state) => {
  if (state === "background" || state === "inactive") {
    flush();
  }
});
