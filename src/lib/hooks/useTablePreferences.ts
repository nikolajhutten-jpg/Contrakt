"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Shared column definitions ────────────────────────────────────────────────

export interface ColumnDef {
  key: string;
  label: string;
  /** Relative weight used for proportional column widths. */
  weight: number;
  defaultVisible: boolean;
}

/** All contract-table columns in their default display order. */
export const ALL_CONTRACT_COLUMNS: ColumnDef[] = [
  { key: "supplier",              label: "Supplier",        weight: 18, defaultVisible: true  },
  { key: "department",            label: "Department",      weight: 12, defaultVisible: true  },
  { key: "owner",                 label: "Owner",           weight: 12, defaultVisible: true  },
  { key: "startDate",             label: "Start date",      weight: 10, defaultVisible: false },
  { key: "endDate",               label: "End date",        weight: 11, defaultVisible: true  },
  { key: "renewalNoticeDeadline", label: "Notice deadline", weight: 13, defaultVisible: true  },
  { key: "autoRenewal",           label: "Auto-renewal",    weight: 9,  defaultVisible: true  },
  { key: "groupEntity",           label: "Group entity",    weight: 12, defaultVisible: false },
  { key: "termType",              label: "Term",            weight: 8,  defaultVisible: false },
  { key: "durationMonths",        label: "Duration",        weight: 9,  defaultVisible: false },
  { key: "status",                label: "Status",          weight: 12, defaultVisible: true  },
];

export const MIN_VISIBLE = 3;

// ─── Global storage ───────────────────────────────────────────────────────────

export const GLOBAL_KEY = "contrakt_view_options";

export interface ColumnPref extends ColumnDef {
  visible: boolean;
}

interface StoredViewOptions {
  columns: { key: string; visible: boolean }[];
}

function defaultColumns(): ColumnPref[] {
  return ALL_CONTRACT_COLUMNS.map((c) => ({ ...c, visible: c.defaultVisible }));
}

function loadAndMerge(): ColumnPref[] {
  try {
    const raw = localStorage.getItem(GLOBAL_KEY);
    if (!raw) return defaultColumns();
    const stored: StoredViewOptions = JSON.parse(raw);
    if (!Array.isArray(stored.columns)) return defaultColumns();

    const known = new Map(ALL_CONTRACT_COLUMNS.map((c) => [c.key, c]));

    // Restore stored order, dropping any keys that no longer exist.
    const merged: ColumnPref[] = stored.columns
      .filter((c) => known.has(c.key))
      .map((c) => ({ ...known.get(c.key)!, visible: c.visible }));

    // Append columns added after the preference was saved.
    const storedKeys = new Set(stored.columns.map((c) => c.key));
    for (const col of ALL_CONTRACT_COLUMNS) {
      if (!storedKeys.has(col.key)) {
        merged.push({ ...col, visible: col.defaultVisible });
      }
    }

    return merged;
  } catch {
    return defaultColumns();
  }
}

function persistColumns(cols: ColumnPref[]) {
  try {
    const value: StoredViewOptions = {
      columns: cols.map((c) => ({ key: c.key, visible: c.visible })),
    };
    localStorage.setItem(GLOBAL_KEY, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
}

// ─── useViewOptions ───────────────────────────────────────────────────────────
// Used by the ViewOptions settings component — full control over column list.

export interface ViewOptionsState {
  columns: ColumnPref[];
  toggleColumn: (key: string) => void;
  reorderColumns: (newOrder: ColumnPref[]) => void;
  resetToDefaults: () => void;
}

export function useViewOptions(): ViewOptionsState {
  const [columns, setColumns] = useState<ColumnPref[]>(defaultColumns);

  useEffect(() => {
    setColumns(loadAndMerge());
  }, []);

  const toggleColumn = useCallback((key: string) => {
    setColumns((prev) => {
      const col = prev.find((c) => c.key === key);
      if (!col) return prev;
      if (col.visible && prev.filter((c) => c.visible).length <= MIN_VISIBLE) return prev;
      const next = prev.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c));
      persistColumns(next);
      return next;
    });
  }, []);

  const reorderColumns = useCallback((newOrder: ColumnPref[]) => {
    setColumns(newOrder);
    persistColumns(newOrder);
  }, []);

  const resetToDefaults = useCallback(() => {
    const defaults = defaultColumns();
    setColumns(defaults);
    persistColumns(defaults);
  }, []);

  return { columns, toggleColumn, reorderColumns, resetToDefaults };
}

// ─── useTablePreferences ──────────────────────────────────────────────────────
// Used by table components. Reads global column prefs + manages per-table sort.

export interface TablePreferences {
  /** Visible column keys in global display order. */
  visibleColumns: string[];
  sortColumn: string | null;
  sortDirection: "asc" | "desc";
  setSort: (col: string) => void;
}

export function useTablePreferences(tableId: string): TablePreferences {
  const sortKey = `contrakt_sort_${tableId}`;

  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    () => ALL_CONTRACT_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key),
  );
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    // Load global column preferences.
    const merged = loadAndMerge();
    setVisibleColumns(merged.filter((c) => c.visible).map((c) => c.key));

    // Load per-table sort state.
    try {
      const raw = localStorage.getItem(sortKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        sortColumn?: string | null;
        sortDirection?: "asc" | "desc";
      };
      if (saved.sortColumn != null) {
        setSortColumn(saved.sortColumn);
        setSortDirection(saved.sortDirection ?? "asc");
      }
    } catch {
      // ignore
    }
  // sortKey is derived from tableId which is a module-level constant in each caller.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setSort = useCallback(
    (col: string) => {
      const save = (c: string | null, d: "asc" | "desc") => {
        try {
          localStorage.setItem(sortKey, JSON.stringify({ sortColumn: c, sortDirection: d }));
        } catch {}
      };
      if (sortColumn !== col) {
        setSortColumn(col);
        setSortDirection("asc");
        save(col, "asc");
      } else if (sortDirection === "asc") {
        setSortDirection("desc");
        save(col, "desc");
      } else {
        // desc → reset to default server order
        setSortColumn(null);
        setSortDirection("asc");
        save(null, "asc");
      }
    },
    [sortColumn, sortDirection, sortKey],
  );

  return { visibleColumns, sortColumn, sortDirection, setSort };
}
