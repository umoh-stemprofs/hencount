"use client";

// Chart card (design.md §2 "Chart card (title, chart, 'View as table')" and
// §4). One shell for every chart in the app:
//   title + data-source badge on top, the chart (or its table twin), a
//   "View as table" link that swaps chart ↔ table, an empty state of
//   icon + one sentence + one button, and a loading skeleton that the
//   dynamically imported chart renderer shows while its chunk arrives.
// Everything is sized to stay readable at 390 px (axis text 12 px min).
import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/** Color-blind safe series palette (design.md §4). Max 6 series. */
export const SERIES_COLORS = [
  "#0072B2",
  "#E69F00",
  "#009E73",
  "#D55E00",
  "#CC79A7",
  "#56B4E9",
] as const;

/** Loss / threshold / chrome colors used by the renderers. */
export const LOSS_COLOR = "#B42318"; // danger token
export const THRESHOLD_COLOR = "#B54708"; // warning token
export const GRID_COLOR = "#E4E7EC"; // border token
export const AXIS_TEXT = { fontSize: 12, fill: "#475467" } as const; // muted token

export interface ChartTableRow {
  key: string;
  cells: ReactNode[];
}

export interface ChartTableData {
  caption: string;
  head: string[];
  rows: ChartTableRow[];
}

export interface ChartEmptyState {
  Icon: LucideIcon;
  /** Exactly one plain sentence (design.md §6). */
  sentence: string;
  /** Exactly one button — a link styled as the card's action. */
  action: ReactNode;
}

/**
 * Loading skeleton shown while the Recharts chunk loads (SSR HTML included).
 * Grey blocks only — no shimmer that ignores reduced motion.
 */
export function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading chart"
      className="flex animate-pulse flex-col justify-end gap-2 motion-reduce:animate-none"
      style={{ height }}
    >
      <div className="flex h-full items-end gap-2">
        {[62, 38, 74, 52, 66, 44, 70].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-border"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="h-3 w-1/3 rounded bg-border" />
    </div>
  );
}

export function ChartCard({
  id,
  title,
  badge,
  empty,
  table,
  /** Optional controls (e.g. the 7/30/90-day toggle), under the chart. */
  controls,
  children,
}: {
  id: string;
  title: string;
  /** Data-source badge, top-right (Live / Saved data / Simulated). */
  badge?: ReactNode;
  /** When set, the whole body becomes this empty state. */
  empty?: ChartEmptyState;
  table: ChartTableData;
  controls?: ReactNode;
  children: ReactNode;
}) {
  const [showTable, setShowTable] = useState(false);
  const EmptyIcon = empty?.Icon;

  return (
    <section
      className="rounded-card border border-border bg-surface p-4 shadow-card sm:p-6"
      aria-labelledby={`${id}-title`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 id={`${id}-title`} className="text-base font-semibold text-text">
          {title}
        </h2>
        {badge}
      </div>

      <div className="mt-4">
        {empty && EmptyIcon ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <EmptyIcon className="h-8 w-8 text-muted" aria-hidden="true" />
            <p className="max-w-[42ch] text-base leading-6 text-muted">
              {empty.sentence}
            </p>
            {empty.action}
          </div>
        ) : showTable ? (
          <div className="max-h-[320px] overflow-auto">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">{table.caption}</caption>
              <thead>
                <tr className="border-b border-border text-muted">
                  {table.head.map((column) => (
                    <th
                      key={column}
                      scope="col"
                      className="whitespace-nowrap py-2 pr-3 font-medium"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row) => (
                  <tr
                    key={row.key}
                    className="border-b border-border last:border-0"
                  >
                    {row.cells.map((cell, i) =>
                      i === 0 ? (
                        <th
                          key={i}
                          scope="row"
                          className="whitespace-nowrap py-2 pr-3 text-left font-normal text-text"
                        >
                          {cell}
                        </th>
                      ) : (
                        <td
                          key={i}
                          className="whitespace-nowrap py-2 pr-3 tabular-nums text-text last:pr-0"
                        >
                          {cell}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          children
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {empty ? (
          <span />
        ) : (
          <button
            type="button"
            onClick={() => setShowTable((open) => !open)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent underline underline-offset-2"
          >
            {showTable ? "View as chart" : "View as table"}
          </button>
        )}
        {controls}
      </div>
    </section>
  );
}
