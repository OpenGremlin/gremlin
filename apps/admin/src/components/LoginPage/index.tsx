import { useState } from "react";
import {
  cognitoConfirmSignup,
  cognitoLogin,
  cognitoSignup,
  setToken,
} from "../../auth";

type Mode = "login" | "signup" | "confirm";

export function LoginPage({
  onLogin,
  signupDisabled,
}: {
  onLogin: () => void;
  signupDisabled: boolean;
}) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { idToken } = await cognitoLogin(email, password);
      setToken(idToken);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { userConfirmed } = await cognitoSignup(email, password);
      if (userConfirmed) {
        // Auto-confirmed — log in directly
        const { idToken } = await cognitoLogin(email, password);
        setToken(idToken);
        onLogin();
      } else {
        setPendingEmail(email);
        setMode("confirm");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await cognitoConfirmSignup(pendingEmail, confirmCode);
      // Now log in
      const { idToken } = await cognitoLogin(pendingEmail, password);
      setToken(idToken);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Confirmation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-dvh items-center justify-center bg-neutral-950">
      <div className="w-full max-w-sm px-6">
        <h1 className="mb-8 text-center text-2xl font-semibold text-white">
          Gremlin
        </h1>

        {mode === "confirm" ? (
          <form onSubmit={handleConfirm} className="flex flex-col gap-4">
            <p className="text-sm text-neutral-400">
              A verification code was sent to{" "}
              <span className="text-neutral-200">{pendingEmail}</span>.
            </p>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-neutral-500">
                Verification Code
              </span>
              <input
                type="text"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                autoComplete="one-time-code"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-700"
              />
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading || !confirmCode.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
          </form>
        ) : (
          <form
            onSubmit={mode === "login" ? handleLogin : handleSignup}
            className="flex flex-col gap-4"
          >
            <label className="flex flex-col gap-1">
              <span className="text-xs text-neutral-500">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-700"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-neutral-500">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-700"
              />
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email.trim() || !password.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading
                ? mode === "login"
                  ? "Logging in..."
                  : "Creating account..."
                : mode === "login"
                  ? "Log in"
                  : "Create account"}
            </button>
            {mode === "login" && !signupDisabled && (
              <p className="text-center text-sm text-neutral-500">
                No account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                  }}
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  Sign up
                </button>
              </p>
            )}
            {mode === "signup" && (
              <p className="text-center text-sm text-neutral-500">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  Log in
                </button>
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
