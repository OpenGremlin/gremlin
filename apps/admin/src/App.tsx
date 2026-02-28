import { useEffect, useState } from "react";
import {
  clearToken,
  extractTokenFromHash,
  getLogoutUrl,
  getToken,
  isAuthEnabled,
  setToken,
} from "./auth";
import { LoginPage } from "./components/LoginPage";
import { RouterApp } from "./components/RouterApp";

export function App() {
  const [token, setTokenState] = useState<string | null>(getToken);

  useEffect(() => {
    const t = extractTokenFromHash();
    if (t) {
      setToken(t);
      setTokenState(t);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  if (!isAuthEnabled()) {
    return <RouterApp />;
  }

  if (!token) {
    return <LoginPage />;
  }

  return (
    <>
      <div style={{ position: "fixed", top: 12, right: 16, zIndex: 100 }}>
        <button
          type="button"
          onClick={() => {
            clearToken();
            window.location.href = getLogoutUrl();
          }}
          style={{
            background: "transparent",
            border: "1px solid #444",
            color: "#888",
            padding: "4px 12px",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          Sign out
        </button>
      </div>
      <RouterApp />
    </>
  );
}
