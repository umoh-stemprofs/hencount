"use client";

// Chart card wrapper: profit per day. The same series drives the table twin
// ("No log" for gaps, the word "Loss" in danger for negative days), and the
// Recharts renderer arrives behind a skeleton.
import dynamic from "next/dynamic";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { formatDayShort, formatNaira } from "@/lib/dates";
import { ChartCard, ChartSkeleton, type ChartTableData } from "./ChartCard";
import type { ProfitPoint } from "@/lib/charts";

const ProfitLineChart = dynamic(() => import("./ProfitLineChart"), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

export function ProfitCard({
  id,
  title,
  badge,
  points,
  emptySentence,
  emptyAction,
  height,
}: {
  id: string;
  title: string;
  badge?: React.ReactNode;
  points: ProfitPoint[];
  emptySentence: string;
  emptyAction: { href: string; label: string };
  height?: number;
}) {
  const isEmpty = points.every((point) => point.profitKobo === null);

  const table: ChartTableData = {
    caption: `${title}, each of the last ${points.length} days, in naira.`,
    head: ["Day", "Profit"],
    rows: points.map((point) => ({
      key: point.date,
      cells: [
        formatDayShort(new Date(`${point.date}T12:00:00Z`)),
        point.profitKobo === null ? (
          <span className="text-muted">{point.logged ? "—" : "No log"}</span>
        ) : point.isLoss ? (
          <span className="font-medium text-danger">
            Loss {formatNaira(Math.abs(point.profitKobo))}
          </span>
        ) : (
          formatNaira(point.profitKobo)
        ),
      ],
    })),
  };

  return (
    <ChartCard
      id={id}
      title={title}
      badge={badge}
      table={table}
      empty={
        isEmpty
          ? {
              Icon: TrendingUp,
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
      <ProfitLineChart points={points} height={height} />
    </ChartCard>
  );
}
