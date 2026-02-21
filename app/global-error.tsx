"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "'Poppins', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          backgroundColor: "#faf5f5",
          color: "#3d1520",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            textAlign: "center",
            padding: "40px 24px",
          }}
        >
          {/* Brand mark */}
          <div
            style={{
              fontSize: "5rem",
              fontWeight: 700,
              lineHeight: 1,
              color: "rgba(180, 60, 80, 0.08)",
              fontFamily:
                "'Playfair Display', 'Georgia', 'Times New Roman', serif",
              marginBottom: 8,
              userSelect: "none",
            }}
          >
            J
          </div>

          {/* Heading */}
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              fontFamily:
                "'Playfair Display', 'Georgia', 'Times New Roman', serif",
              margin: "0 0 12px",
              letterSpacing: "-0.02em",
            }}
          >
            Something Went Wrong
          </h1>

          {/* Description */}
          <p
            style={{
              fontSize: "1rem",
              lineHeight: 1.6,
              color: "#7a5060",
              margin: "0 0 8px",
            }}
          >
            An unexpected error occurred. Please try again or return to the home
            page.
          </p>

          {/* Error digest */}
          {error.digest && (
            <p
              style={{
                fontSize: "0.75rem",
                fontFamily: "'Roboto Mono', monospace",
                color: "#a08090",
                margin: "0 0 32px",
              }}
            >
              Reference: {error.digest}
            </p>
          )}

          {/* Buttons */}
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
              marginTop: error.digest ? 0 : 32,
            }}
          >
            <button
              onClick={reset}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: 40,
                padding: "0 24px",
                fontSize: "0.875rem",
                fontWeight: 600,
                fontFamily: "inherit",
                color: "#fff",
                backgroundColor: "#b43c50",
                border: "none",
                borderRadius: 16,
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#a03548")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "#b43c50")
              }
            >
              Try Again
            </button>
            <a
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: 40,
                padding: "0 24px",
                fontSize: "0.875rem",
                fontWeight: 600,
                fontFamily: "inherit",
                color: "#3d1520",
                backgroundColor: "transparent",
                border: "1px solid #d8c0c8",
                borderRadius: 16,
                cursor: "pointer",
                textDecoration: "none",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#f0e8ea")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              Go Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
