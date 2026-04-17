import Link from "next/link";

/**
 * Global 404 page — shown when a route or resource cannot be found.
 * Also shown when page components call notFound() from "next/navigation".
 */
export default function NotFound() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "0 32px", textAlign: "center", background: "#f5f5f7" }}>
      <p style={{ fontSize: "11px", fontWeight: 500, color: "rgba(0,0,0,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "12px" }}>
        404
      </p>
      <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#171717", letterSpacing: "-0.03em", marginBottom: "8px" }}>
        Page not found
      </h1>
      <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.5)", marginBottom: "24px", maxWidth: "280px" }}>
        The page you&apos;re looking for doesn&apos;t exist or you don&apos;t
        have access to it.
      </p>
      <Link
        href="/dashboard"
        style={{
          fontSize: "13px",
          fontWeight: 500,
          padding: "7px 16px",
          background: "#1a7f4b",
          color: "#ffffff",
          borderRadius: "8px",
          textDecoration: "none",
          letterSpacing: "-0.01em",
        }}
      >
        Go to dashboard
      </Link>
    </div>
  );
}
