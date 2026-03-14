import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  clearToken,
  getToken,
  isAuthEnabled,
  setOnUnauthorized,
  setToken,
} from "./auth";

interface AuthState {
  token: string | null;
  loading: boolean;
  signupDisabled: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  token: null,
  loading: true,
  signupDisabled: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signupDisabled, setSignupDisabled] = useState(true);

  const logout = useCallback(async () => {
    await clearToken();
    setTokenState(null);
  }, []);

  useEffect(() => {
    // Register the 401 handler so gql() can trigger a redirect to login
    setOnUnauthorized(() => {
      setTokenState(null);
    });
  }, []);

  useEffect(() => {
    (async () => {
      if (!isAuthEnabled()) {
        setLoading(false);
        setTokenState("__skip__");
        return;
      }
      const existing = await getToken();
      setTokenState(existing);
      setLoading(false);
    })();
  }, []);

  // Fetch signup status
  useEffect(() => {
    const { getApiUrl } = require("./config");
    const apiUrl = getApiUrl();
    fetch(`${apiUrl}/api/auth-config`)
      .then((r) => r.json())
      .then((data) => {
        setSignupDisabled(data.signupDisabled === true);
      })
      .catch(() => {
        setSignupDisabled(false);
      });
  }, []);

  const login = useCallback(async (t: string) => {
    await setToken(t);
    setTokenState(t);
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, loading, signupDisabled, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
