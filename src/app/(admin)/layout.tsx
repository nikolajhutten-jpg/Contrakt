export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#ffffff" }}>
      <div
        style={{
          padding: "14px 24px",
          borderBottom: "0.5px solid rgba(0,0,0,0.08)",
        }}
      >
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#1a1a1a" }}>
          Contrakt Admin
        </span>
      </div>
      <div>{children}</div>
    </div>
  );
}
