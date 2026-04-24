"use client";

import Link from "next/link";

interface BackLinkProps {
  href: string;
}

export default function BackLink({ href }: BackLinkProps) {
  return (
    <Link
      href={href}
      style={{
        fontSize: "13px",
        color: "rgba(0,0,0,0.4)",
        textDecoration: "none",
        display: "inline-block",
        marginBottom: "16px",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.color = "#1a7f4b";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.4)";
      }}
    >
      ← Back
    </Link>
  );
}
