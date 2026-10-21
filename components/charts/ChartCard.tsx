"use client";

// Chart card (docs/design.md §2 and §4), rebuilt to the mockup structure in
// stitch_.../hencount_home_desktop and hencount_prices_today_desktop:
//
//   [chevron] Title ...................... data-source badge
//   ── chart or its empty state ──
//   optional one-line summary (total, week-over-week change)
//   [chevron] Show numbers / View as table / Tap to view  →  the same data
//
// The chart header is an accordion so a dashboard column can stack several
// charts the way the mockup does. The table is a second, separate accordion
// with the mockup's wording; its accessible name still says "View as table"
// because that is the phrasing the Agriculture rules are checked against.
// Nothing about the data changes — same rows, same gaps, same 7/30/90 window.
import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";

/** Color-blind safe series palette (docs/design.md §4). Max 6 series. */
export const SERIES_COLORS = [
  "#0072B2",
  "#E69F00",
  "#009E73",
  "#D55E00",
  "#CC79A7",
  "#56B4E9",
] as const;

/**
 * Chart chrome, taken from the mockups rather than guessed:
 * ochre series, a pale #E9EDFF grid, a slightly stronger axis rule, and a
 * dashed danger threshold line for the "check your hens" floor.
 */
export const LOSS_COLOR = "#B42318"; // danger token
export const ACCENT_SERIES = "#9A5B00"; // the mockups' single-series ochre
export const THRESHOLD_COLOR = "#B42318"; // danger — the low line
export const GRID_COLOR = "#E9EDFF"; // mockup grid
export const AXIS_LINE_COLOR = "#D0D5DD"; // border-strong token
/** DESIGN.md forbids text under 16px, axis labels included. */
export const AXIS_TEXT = { fontSize: 16, fill: "#475467" } as const; // muted

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
  /** Exactly one plain sentence (docs/design.md §6). */
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

function AccordionHeader({
  id,
  icon,
  title,
  subtitle,
  badge,
  trailing,
  open,
  onToggle,
  headingLevel = 2,
}: {
  id: string;
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  trailing?: ReactNode;
  open: boolean;
  onToggle: () => void;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={`${id}-body`}
      className="flex w-full flex-wrap items-center justify-between gap-space-sm rounded-card p-space-lg text-left transition-colors hover:bg-[#F1F3FF]"
    >
      <span className="flex min-w-0 flex-1 basis-48 flex-col gap-1">
        <span className="flex items-start gap-space-sm">
          {icon}
          {/* No truncate: DESIGN.md keeps text readable, and the badge below
              reflows instead of squeezing the title into "Eggs ...". */}
          <Heading className="text-headline-sm text-text">{title}</Heading>
        </span>
        {subtitle && (
          <span className="pl-8 text-body-base text-muted">{subtitle}</span>
        )}
      </span>
      <span className="flex shrink-0 flex-wrap items-center justify-end gap-space-sm">
        {badge}
        {trailing}
        <ChevronDown
          className={`h-7 w-7 shrink-0 text-muted transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </span>
    </button>
  );
}

export function ChartCard({
  id,
  title,
  icon,
  badge,
  empty,
  table,
  /** Optional controls (the 7/30/90-day toggle), beside the header. */
  controls,
  /** One-line summary under the chart — e.g. "Total 7 days: 4,215 eggs". */
  summary,
  children,
}: {
  id: string;
  title: string;
  /** Small stroke icon before the title, as in the mockups. */
  icon?: ReactNode;
  /** Data-source badge, top-right (Live / Saved data / Simulated). */
  badge?: ReactNode;
  /** When set, the whole body becomes this empty state. */
  empty?: ChartEmptyState;
  table: ChartTableData;
  controls?: ReactNode;
  summary?: ReactNode;
  children: ReactNode;
}) {
  const [chartOpen, setChartOpen] = useState(true);
  const [showTable, setShowTable] = useState(false);
  const EmptyIcon = empty?.Icon;

  return (
    <section
      className="overflow-hidden rounded-card border border-border bg-surface shadow-card"
      aria-labelledby={`${id}-title`}
    >
      <div className="border-b border-border">
        <span id={`${id}-title`} className="sr-only">
          {title}
        </span>
        <AccordionHeader
          id={`${id}-chart`}
          icon={icon}
          title={title}
          badge={badge}
          trailing={controls}
          open={chartOpen}
          onToggle={() => setChartOpen((v) => !v)}
        />
      </div>

      <div id={`${id}-chart-body`} hidden={!chartOpen}>
        <div className="px-space-lg pt-space-lg">
          {empty && EmptyIcon ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <EmptyIcon className="h-8 w-8 text-muted" aria-hidden="true" />
              <p className="max-w-[42ch] text-body-lg leading-7 text-muted">
                {empty.sentence}
              </p>
              {empty.action}
            </div>
          ) : showTable ? (
            <div className="max-h-[320px] overflow-auto">
              <table className="w-full border-collapse text-left text-body-base">
                <caption className="sr-only">{table.caption}</caption>
                <thead>
                  <tr className="bg-[#F1F3FF] text-text">
                    {table.head.map((column) => (
                      <th
                        key={column}
                        scope="col"
                        className="whitespace-nowrap p-space-md font-semibold first:rounded-l-lg last:rounded-r-lg"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {table.rows.map((row) => (
                    <tr key={row.key} className="hover:bg-[#F1F3FF]/50">
                      {row.cells.map((cell, i) =>
                        i === 0 ? (
                          <th
                            key={i}
                            scope="row"
                            className="whitespace-nowrap p-space-md text-left font-normal text-text"
                          >
                            {cell}
                          </th>
                        ) : (
                          <td
                            key={i}
                            className="whitespace-nowrap p-space-md tabular-nums text-text"
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

        {summary && !showTable && (
          <div className="px-space-lg pb-4 text-body-base text-muted">
            {summary}
          </div>
        )}
      </div>

      {/* The mockup's second accordion: the same numbers as a table. */}
      {!empty && (
        <div className="border-t border-border">
          <button
            type="button"
            onClick={() => setShowTable((open) => !open)}
            aria-expanded={showTable}
            aria-label={
              showTable ? "View chart instead of table" : "View as table"
            }
            className="flex w-full flex-wrap items-center justify-between gap-space-sm p-space-lg text-left transition-colors hover:bg-[#F1F3FF]"
          >
            <span className="flex min-w-0 flex-1 basis-52 items-start gap-space-sm">
              <ChevronDown
                className={`h-7 w-7 shrink-0 text-muted transition-transform duration-200 ${
                  showTable ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
              <span className="flex min-w-0 flex-col">
                <span className="text-headline-sm text-text">Show numbers</span>
                <span className="text-body-base text-muted">
                  View as table — {table.rows.length} rows
                </span>
              </span>
            </span>
            <span className="shrink-0 rounded-chip bg-[#F1F3FF] px-space-sm py-1 text-label-base text-muted">
              {showTable ? "Hide" : "Tap to view"}
            </span>
          </button>
        </div>
      )}
    </section>
  );
}
