"use client";

// The one tooltip shape every line/bar chart uses (design.md §4: tooltip on
// tap, units included). A day with no data says "No log" instead of showing
// a zero; values are formatted by the caller so money always reads ₦.
import type { ReactNode } from "react";
import { formatDayShort } from "@/lib/dates";

export interface TooltipRow {
  dataKey?: string | number;
  name?: string | number;
  value?: unknown;
  color?: string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatValue,
  noDataText = "No log",
  hideNames = false,
}: {
  active?: boolean;
  payload?: TooltipRow[];
  label?: unknown;
  formatValue: (row: TooltipRow) => ReactNode;
  noDataText?: string;
  /** Single-series charts say the whole word in the value ("Loss ₦3,000"). */
  hideNames?: boolean;
}): ReactNode {
  if (!active || !payload || payload.length === 0) return null;
  const rows = payload.filter((row) => row.value !== null && row.value !== undefined);

  const day =
    typeof label === "string" && /^\d{4}-\d{2}-\d{2}$/.test(label)
      ? formatDayShort(new Date(`${label}T12:00:00Z`))
      : label;

  return (
    <div className="rounded-input border border-border bg-surface px-3 py-2 shadow-card">
      {day !== undefined && day !== null && day !== "" && (
        <p className="text-xs text-muted">{String(day)}</p>
      )}
      {rows.length === 0 ? (
        <p className="text-sm text-muted">{noDataText}</p>
      ) : (
        rows.map((row, i) => (
          <p
            key={String(row.dataKey ?? i)}
            className="text-sm font-medium tabular-nums"
            style={{ color: row.color ?? "#101828" }}
          >
            {!hideNames && row.name !== undefined && row.name !== "" ? (
              <span className="mr-1.5 font-normal text-muted">
                {String(row.name)}:
              </span>
            ) : null}
            {formatValue(row)}
          </p>
        ))
      )}
    </div>
  );
}
