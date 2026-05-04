"use client";

import Link from "next/link";

interface BackLinkProps {
  href: string;
}

export default function BackLink({ href }: BackLinkProps) {
  return (
    <Link
      href={href}
      className="back-link"
      style={{
        fontSize: "13px",
        textDecoration: "none",
        display: "inline-block",
        marginBottom: "16px",
      }}
    >
      ← Back
    </Link>
  );
}
