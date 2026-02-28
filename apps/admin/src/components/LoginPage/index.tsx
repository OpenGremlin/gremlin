import { getLoginUrl } from "../../auth";

export function LoginPage() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#0a0a0a",
      }}
    >
      <div
        style={{
          background: "#1a1a1a",
          border: "1px solid #333",
          borderRadius: 12,
          padding: "48px 40px",
          textAlign: "center",
          maxWidth: 360,
        }}
      >
        <h1
          style={{
            color: "#e5e5e5",
            fontSize: 24,
            margin: "0 0 8px",
          }}
        >
          Gremlin Admin
        </h1>
        <p style={{ color: "#888", fontSize: 14, margin: "0 0 32px" }}>
          Sign in to access the dashboard
        </p>
        <a
          href={getLoginUrl()}
          style={{
            display: "inline-block",
            padding: "10px 24px",
            background: "#4285f4",
            color: "#fff",
            borderRadius: 6,
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Sign in with Google
        </a>
      </div>
    </div>
  );
}
