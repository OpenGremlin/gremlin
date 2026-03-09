import { useCallback, useEffect, useState } from "react";
import {
  extractTokenFromHash,
  getToken,
  isAuthEnabled,
  setToken,
} from "./auth";
import { LoginPage } from "./components/LoginPage";
import { RouterApp } from "./components/RouterApp";
import { clientLogger } from "./logger";

function getInitialToken(): string | null {
  // Support legacy Cognito hosted UI hash tokens
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
  const [token, setTokenState] = useState(getInitialToken);
  const [signupDisabled, setSignupDisabled] = useState(true); // default to disabled until we know

  // Fetch signup status on mount
  useEffect(() => {
    const apiUrl =
      (
        (window as unknown as Record<string, unknown>).__GREMLIN_CONFIG__ as
          | { apiUrl?: string }
          | undefined
      )?.apiUrl ||
      (import.meta.env.VITE_API_URL as string) ||
      "";
    fetch(`${apiUrl}/api/auth-config`)
      .then((r) => r.json())
      .then((data) => {
        setSignupDisabled(data.signupDisabled === true);
      })
      .catch(() => {
        // If we can't reach the server, allow signup by default
        setSignupDisabled(false);
      });
  }, []);

  const handleLogin = useCallback(() => {
    setTokenState(getToken());
  }, []);

  if (!isAuthEnabled()) {
    clientLogger.debug("Auth disabled, rendering without login");
    return <RouterApp />;
  }

  if (!token) {
    return <LoginPage onLogin={handleLogin} signupDisabled={signupDisabled} />;
  }

  return <RouterApp />;
}
