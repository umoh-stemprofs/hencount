"use client";

// Market chart card: the egg tray price over 7, 30 or 90 days (design.md
// S-MARKET). The toggle switches the visible window; "View as table" shows
// exactly the same window as rows. No prices at all → one sentence and one
// button, never a blank axes frame.
import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { LineChart as LineChartIcon } from "lucide-react";
import { formatDayShort, formatNaira } from "@/lib/dates";
import { ChartCard, ChartSkeleton, type ChartTableData } from "./ChartCard";
import type { PricePoint } from "./PriceLineChart";

const PriceLineChart = dynamic(() => import("./PriceLineChart"), {
  ssr: false,
  loading: () => <ChartSkeleton height={260} />,
});

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

export function PriceChartCard({
  id,
  title,
  badge,
  series,
  emptySentence,
  emptyAction,
}: {
  id: string;
  title: string;
  badge?: React.ReactNode;
  /** Up to 90 days, oldest first, ending today. */
  series: PricePoint[];
  emptySentence: string;
  emptyAction?: { href: string; label: string };
}) {
  const [range, setRange] = useState<Range>(7);
  const isEmpty = series.length === 0;
  const points = isEmpty ? [] : series.slice(-range);

  const table: ChartTableData = {
    caption: `Egg tray price for each of the last ${points.length} days, in naira.`,
    head: ["Day", "Price per tray"],
    rows: points.map((point) => ({
      key: point.date,
      cells: [
        formatDayShort(new Date(`${point.date}T12:00:00Z`)),
        formatNaira(point.priceKobo),
      ],
    })),
  };

  const controls = isEmpty ? undefined : (
    <div
      className="inline-flex rounded-input border border-border bg-surface p-0.5"
      role="group"
      aria-label="Chart range"
    >
      {RANGES.map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={range === value}
          onClick={() => setRange(value)}
          className={`h-8 rounded-[6px] px-3 text-sm font-medium transition-colors ${
            range === value
              ? "bg-accent text-white"
              : "text-muted hover:text-text"
          }`}
        >
          {value} days
        </button>
      ))}
    </div>
  );

  return (
    <ChartCard
      id={id}
      title={title}
      badge={badge}
      table={table}
      controls={controls}
      empty={
        isEmpty && emptyAction
          ? {
              Icon: LineChartIcon,
              sentence: emptySentence,
              action: (
                <Link
                  href={emptyAction.href}
                  className="inline-flex h-11 items-center rounded-input bg-accent px-4 text-sm font-semibold text-white"
                >
                  {emptyAction.label}
                </Link>
              ),
            }
          : undefined
      }
    >
      <PriceLineChart key={range} points={points} />
    </ChartCard>
  );
}
