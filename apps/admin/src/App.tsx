import { useState } from "react";
import {
  extractTokenFromHash,
  getLoginUrl,
  getToken,
  isAuthEnabled,
  setToken,
} from "./auth";
import { RouterApp } from "./components/RouterApp";
import { clientLogger } from "./logger";

function getInitialToken(): string | null {
  const hash = extractTokenFromHash();
  if (hash) {
    setToken(hash);
    window.history.replaceState(null, "", window.location.pathname);
    clientLogger.info("Authenticated via URL hash token");
    return hash;
  }
  const existing = getToken();
  if (existing) {
    clientLogger.debug("Resumed session from stored token");
  }
  return existing;
}

export function App() {
  const [token] = useState(getInitialToken);

  if (!isAuthEnabled()) {
    clientLogger.debug("Auth disabled, rendering without login");
    return <RouterApp />;
  }

  if (!token) {
    clientLogger.info("No token found, redirecting to login");
    window.location.href = getLoginUrl();
    return null;
  }

  return <RouterApp />;
}
