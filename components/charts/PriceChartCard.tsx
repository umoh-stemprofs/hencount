"use client";

// Market chart card: the egg tray price over 7, 30 or 90 days
// (docs/design.md S-MARKET), with the mockup's segmented range control in the
// accordion header. "Show numbers" below the chart shows exactly the same
// window as rows. No prices at all → one sentence and one button, never a
// blank axes frame.
import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { LineChart as LineChartIcon, TrendingUp } from "lucide-react";
import { formatDayShort, formatNaira } from "@/lib/dates";
import { btnSecondary } from "@/components/ui";
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
  icon,
  badge,
  series,
  emptySentence,
  emptyAction,
}: {
  id: string;
  title: string;
  icon?: React.ReactNode;
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

  // DESIGN.md: selection controls are chunky and never rely on colour alone,
  // so the active range carries aria-pressed as well as the ochre fill.
  const controls = isEmpty ? undefined : (
    <span
      className="flex items-center gap-1 rounded-xl bg-[#F1F3FF] p-1"
      role="group"
      aria-label="Chart range"
    >
      {RANGES.map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={range === value}
          onClick={() => setRange(value)}
          className={`min-h-[44px] rounded-lg px-space-md text-label-base transition-colors ${
            range === value
              ? "bg-accent text-white"
              : "text-muted hover:bg-[#E0E8FF] hover:text-text"
          }`}
        >
          {value} days
        </button>
      ))}
    </span>
  );

  return (
    <ChartCard
      id={id}
      title={title}
      icon={icon ?? <TrendingUp className="h-6 w-6 text-accent" aria-hidden="true" />}
      badge={badge}
      table={table}
      controls={controls}
      empty={
        isEmpty && emptyAction
          ? {
              Icon: LineChartIcon,
              sentence: emptySentence,
              action: (
                <Link href={emptyAction.href} className={btnSecondary}>
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
