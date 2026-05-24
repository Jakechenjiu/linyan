"use client";

import { useEffect } from "react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html>
      <body style={{ margin: 0, background: "#0a0e17", color: "#e0e0e0", fontFamily: "system-ui, sans-serif" }}>
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          minHeight: "100vh", padding: "2rem", textAlign: "center",
        }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem", color: "#ef4444" }}>
            页面加载失败
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#9ca3af", marginBottom: "1.5rem", maxWidth: "28rem" }}>
            {error.message || "发生了未知错误，请刷新页面重试。"}
          </p>
          <button
            onClick={reset}
            style={{
              padding: "0.625rem 1.5rem", borderRadius: "0.75rem", border: "none",
              background: "#00e5ff", color: "#0a0e17", fontWeight: 600, cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            重新加载
          </button>
        </div>
      </body>
    </html>
  );
}
