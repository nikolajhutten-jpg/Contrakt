"use client";

import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md";
}

const BASE =
  "inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const VARIANT_STYLE: Record<NonNullable<ButtonProps["variant"]>, React.CSSProperties> = {
  primary: {
    background: "#1a7f4b",
    color: "#ffffff",
    border: "none",
  },
  secondary: {
    background: "rgba(0,0,0,0.05)",
    color: "inherit",
    border: "0.5px solid rgba(0,0,0,0.1)",
  },
  danger: {
    background: "rgba(0,0,0,0.05)",
    color: "#c0392b",
    border: "0.5px solid rgba(0,0,0,0.1)",
  },
};

const SIZE_CLASS: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5",
  md: "px-4 py-1.5",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  style,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${BASE} ${SIZE_CLASS[size]} ${className}`}
      style={{
        borderRadius: "8px",
        fontSize: "13px",
        letterSpacing: "-0.01em",
        fontFamily: "inherit",
        ...VARIANT_STYLE[variant],
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
