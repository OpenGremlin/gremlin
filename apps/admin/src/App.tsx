import { useState } from "react";
import {
  extractTokenFromHash,
  getLoginUrl,
  getToken,
  isAuthEnabled,
  setToken,
} from "./auth";
import { RouterApp } from "./components/RouterApp";

function getInitialToken(): string | null {
  const hash = extractTokenFromHash();
  if (hash) {
    setToken(hash);
    window.history.replaceState(null, "", window.location.pathname);
    return hash;
  }
  return getToken();
}

export function App() {
  const [token] = useState(getInitialToken);

  if (!isAuthEnabled()) {
    return <RouterApp />;
  }

  if (!token) {
    window.location.href = getLoginUrl();
    return null;
  }

  return <RouterApp />;
}
