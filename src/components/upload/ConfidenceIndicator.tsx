import { useState } from "react";
import type { ConfidenceLevel } from "@/types";

interface ConfidenceIndicatorProps {
  level: ConfidenceLevel | null | undefined;
}

const CONFIG: Record<ConfidenceLevel, { color: string; label: string }> = {
  high:   { color: "#1a7f4b", label: "High confidence" },
  medium: { color: "#d97706", label: "Medium confidence" },
  low:    { color: "rgba(0,0,0,0.2)", label: "Not detected" },
};

export default function ConfidenceIndicator({ level }: ConfidenceIndicatorProps) {
  const [hovered, setHovered] = useState(false);
  const { color, label } = level ? CONFIG[level] : { color: "rgba(0,0,0,0.2)", label: "Not detected" };

  return (
    <span
      style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        style={{
          display: "inline-block",
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
        }}
      />
      {hovered && (
        <span
          style={{
            position: "absolute",
            bottom: "calc(100% + 4px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.75)",
            color: "#ffffff",
            fontSize: "12px",
            padding: "4px 8px",
            borderRadius: "6px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 50,
          }}
        >
          {label}
        </span>
      )}
    </span>
  );
}
