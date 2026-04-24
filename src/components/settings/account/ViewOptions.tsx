"use client";

import { useState } from "react";
import { useViewOptions, MIN_VISIBLE } from "@/lib/hooks/useTablePreferences";
import type { ColumnPref } from "@/lib/hooks/useTablePreferences";

export default function ViewOptions() {
  const { columns, toggleColumn, reorderColumns, resetToDefaults } = useViewOptions();

  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const visibleCount = columns.filter((c) => c.visible).length;

  // ─── Drag and drop handlers ─────────────────────────────────────────────────

  function handleDragStart(e: React.DragEvent, index: number) {
    setDragging(index);
    e.dataTransfer.effectAllowed = "move";
    // Required for Firefox
    e.dataTransfer.setData("text/plain", String(index));
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOver !== index) setDragOver(index);
  }

  function handleDrop(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragging === null || dragging === index) {
      setDragging(null);
      setDragOver(null);
      return;
    }
    const next = [...columns];
    const [moved] = next.splice(dragging, 1);
    next.splice(index, 0, moved);
    reorderColumns(next);
    setDragging(null);
    setDragOver(null);
  }

  function handleDragEnd() {
    setDragging(null);
    setDragOver(null);
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: "4px" }}
      >
        <p
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#171717",
          }}
        >
          View options
        </p>
        <button
          onClick={resetToDefaults}
          style={{
            fontSize: "12px",
            color: "rgba(0,0,0,0.4)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "2px 0",
            letterSpacing: "-0.01em",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#171717";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.4)";
          }}
        >
          Reset to defaults
        </button>
      </div>
      <p
        style={{
          fontSize: "12px",
          color: "rgba(0,0,0,0.4)",
          marginBottom: "12px",
        }}
      >
        Choose which columns appear in contract tables and drag to reorder them.
      </p>

      <div
        style={{
          background: "#ffffff",
          border: "0.5px solid rgba(0,0,0,0.08)",
          borderRadius: "10px",
          overflow: "hidden",
          maxWidth: "480px",
        }}
      >
        {columns.map((col: ColumnPref, index: number) => {
          const isBeingDragged = dragging === index;
          const isDragTarget = dragOver === index && dragging !== index;
          const atMinimum = col.visible && visibleCount <= MIN_VISIBLE;

          return (
            <div
              key={col.key}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "0 14px",
                height: "40px",
                borderBottom:
                  index < columns.length - 1
                    ? "0.5px solid rgba(0,0,0,0.06)"
                    : "none",
                background: isBeingDragged
                  ? "rgba(0,0,0,0.03)"
                  : "transparent",
                borderTop: isDragTarget
                  ? "2px solid #171717"
                  : "2px solid transparent",
                opacity: isBeingDragged ? 0.5 : 1,
                cursor: "grab",
                transition: "background 0.1s",
              }}
            >
              {/* Drag handle */}
              <span
                style={{
                  fontSize: "14px",
                  color: "rgba(0,0,0,0.2)",
                  lineHeight: 1,
                  flexShrink: 0,
                  userSelect: "none",
                }}
                aria-hidden
              >
                ⠿
              </span>

              {/* Checkbox */}
              <input
                type="checkbox"
                checked={col.visible}
                disabled={atMinimum}
                onChange={() => toggleColumn(col.key)}
                style={{
                  margin: 0,
                  flexShrink: 0,
                  cursor: atMinimum ? "not-allowed" : "pointer",
                  opacity: atMinimum ? 0.4 : 1,
                }}
              />

              {/* Label */}
              <span
                style={{
                  fontSize: "13px",
                  color: col.visible ? "#171717" : "rgba(0,0,0,0.4)",
                  flexGrow: 1,
                  userSelect: "none",
                }}
              >
                {col.label}
              </span>
            </div>
          );
        })}
      </div>

      {visibleCount <= MIN_VISIBLE && (
        <p
          style={{
            fontSize: "12px",
            color: "rgba(0,0,0,0.4)",
            marginTop: "8px",
          }}
        >
          At least {MIN_VISIBLE} columns must remain visible.
        </p>
      )}
    </div>
  );
}
