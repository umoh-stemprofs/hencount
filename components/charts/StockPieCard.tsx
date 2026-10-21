"use client";

// Chart card wrapper: share of egg stock value by flock. The table twin
// lists the same slices with eggs and naira; an empty farm gets an icon,
// one sentence and one button instead of an empty circle.
import dynamic from "next/dynamic";
import Link from "next/link";
import { PieChart } from "lucide-react";
import { formatDayShort, formatNaira } from "@/lib/dates";
import { btnSecondary } from "@/components/ui";
import { ChartCard, ChartSkeleton, type ChartTableData } from "./ChartCard";
import type { StockSlice } from "@/lib/charts";

const StockPieChart = dynamic(() => import("./StockPieChart"), {
  ssr: false,
  loading: () => <ChartSkeleton height={220} />,
});

export function StockPieCard({
  id,
  title,
  icon,
  badge,
  slices,
  priceDate,
  emptySentence,
  emptyAction,
}: {
  id: string;
  title: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  slices: StockSlice[];
  /** "YYYY-MM-DD" of the tray price behind these values, for the table. */
  priceDate: string | null;
  emptySentence: string;
  emptyAction: { href: string; label: string };
}) {
  const isEmpty = slices.length === 0;

  const table: ChartTableData = {
    caption: `${title}: stock eggs and their value per flock, in naira.`,
    head: ["Flock", "Eggs in stock", "Stock value"],
    rows: slices.map((slice) => ({
      key: slice.name,
      cells: [slice.name, `${slice.stockEggs}`, formatNaira(slice.valueKobo)],
    })),
  };

  return (
    <ChartCard
      id={id}
      title={title}
      icon={icon}
      badge={badge}
      table={table}
      empty={
        isEmpty
          ? {
              Icon: PieChart,
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
      <div>
        <StockPieChart slices={slices} />
        {priceDate && (
          <p className="mt-2 text-body-base leading-6 text-muted">
            Values at today&apos;s tray price ·{" "}
            {formatDayShort(new Date(`${priceDate}T12:00:00Z`))}
          </p>
        )}
      </div>
    </ChartCard>
  );
}
