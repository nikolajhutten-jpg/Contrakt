"use client";

import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md";
}

const BASE =
  "inline-flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed";

const VARIANT_CLASS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:   "btn-primary",
  secondary: "btn-secondary",
  danger:    "btn-danger",
};

const SIZE_STYLE: Record<NonNullable<ButtonProps["size"]>, React.CSSProperties> = {
  sm: { padding: "5px 12px" },
  md: { padding: "7px 16px" },
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
      className={`${BASE} ${VARIANT_CLASS[variant]} ${className}`}
      style={{
        borderRadius: "8px",
        fontSize: "13px",
        letterSpacing: "-0.01em",
        fontFamily: "inherit",
        cursor: "pointer",
        ...SIZE_STYLE[size],
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
