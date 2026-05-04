"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
  id: string;
  name: string;
}

interface ComboSelectProps {
  options: Option[];
  value: string | null;
  onChange: (id: string) => void;
  onCreateNew: (name: string) => Promise<Option>;
  placeholder: string;
}

const DROPDOWN_STYLE: React.CSSProperties = {
  position: "absolute",
  zIndex: 10,
  marginTop: "4px",
  width: "100%",
  background: "#ffffff",
  border: "0.5px solid rgba(0,0,0,0.1)",
  borderRadius: "8px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  maxHeight: "192px",
  overflowY: "auto",
};

const ROW_BTN: React.CSSProperties = {
  width: "100%",
  textAlign: "left",
  padding: "8px 12px",
  fontSize: "13px",
  background: "none",
  border: "none",
  cursor: "pointer",
  display: "block",
};

export default function ComboSelect({
  options,
  value,
  onChange,
  onCreateNew,
  placeholder,
}: ComboSelectProps) {
  const [added, setAdded] = useState<Option[]>([]);
  const [query, setQuery] = useState(() => options.find((o) => o.id === value)?.name ?? "");
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const allOptions = [...options, ...added];

  // Always captures latest values for the stable outside-click handler
  const closeRef = useRef(() => {});
  closeRef.current = () => {
    setOpen(false);
    setQuery(allOptions.find((o) => o.id === value)?.name ?? "");
  };

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeRef.current();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = allOptions.filter((o) =>
    o.name.toLowerCase().includes(query.toLowerCase()),
  );
  const hasExactMatch = allOptions.some(
    (o) => o.name.toLowerCase() === query.toLowerCase(),
  );
  const showCreate = query.trim() !== "" && !hasExactMatch;

  async function handleCreate() {
    if (!query.trim() || creating) return;
    setCreating(true);
    try {
      const created = await onCreateNew(query.trim());
      setAdded((prev) => [...prev, created]);
      onChange(created.id);
      setQuery(created.name);
      setOpen(false);
    } finally {
      setCreating(false);
    }
  }

  function select(option: Option) {
    onChange(option.id);
    setQuery(option.name);
    setOpen(false);
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <input
        type="text"
        value={creating ? "Creating…" : query}
        disabled={creating}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
      />

      {open && !creating && (
        <div style={DROPDOWN_STYLE}>
          {filtered.length === 0 && !showCreate && (
            <p style={{ padding: "8px 12px", fontSize: "12px", color: "rgba(0,0,0,0.35)" }}>
              No matches.
            </p>
          )}

          {filtered.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => select(o)}
              style={{ ...ROW_BTN, color: "#171717" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.03)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
            >
              {o.name}
            </button>
          ))}

          {showCreate && (
            <button
              type="button"
              onClick={handleCreate}
              style={{
                ...ROW_BTN,
                color: "rgba(0,0,0,0.4)",
                borderTop: filtered.length > 0 ? "0.5px solid rgba(0,0,0,0.06)" : "none",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#171717"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.4)"; }}
            >
              Create new: &ldquo;{query.trim()}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
