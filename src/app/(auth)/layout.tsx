/**
 * Minimal layout for public authentication pages (sign-up, email verification).
 * No sidebar — content is centred on the page.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f7", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
      <div style={{ width: "100%", maxWidth: "384px", background: "#ffffff", border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: "12px", padding: "32px" }}>
        <div style={{ marginBottom: "24px" }}>
          <span style={{ fontSize: "16px", fontWeight: 600, color: "#171717", letterSpacing: "-0.02em" }}>Contrakt</span>
        </div>
        {children}
      </div>
    </div>
  );
}
