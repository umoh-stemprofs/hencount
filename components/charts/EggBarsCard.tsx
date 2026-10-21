"use client";

// Chart card wrapper: eggs per day (advice adds the 60% line, the dashboard
// shows all flocks together). Loads the Recharts renderer on demand so the
// shell paints first with a skeleton, and swaps to the same data as a table.
import dynamic from "next/dynamic";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { formatDayShort } from "@/lib/dates";
import { btnSecondary } from "@/components/ui";
import { ChartCard, ChartSkeleton, type ChartTableData } from "./ChartCard";
import type { EggBarPoint } from "./EggBarsChart";

const EggBarsChart = dynamic(() => import("./EggBarsChart"), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

export function EggBarsCard({
  id,
  title,
  icon,
  badge,
  points,
  showThreshold = false,
  emptySentence = "No days logged yet.",
  emptyAction,
  height,
  summary,
}: {
  id: string;
  title: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  points: EggBarPoint[];
  showThreshold?: boolean;
  emptySentence?: string;
  /** The empty state's one button — usually the "Add today" link. */
  emptyAction: { href: string; label: string };
  height?: number;
  /** One-line summary under the chart. */
  summary?: React.ReactNode;
}) {
  const isEmpty = points.every((point) => point.eggs === null);

  const table: ChartTableData = {
    caption: `${title}, each of the last ${points.length} days.`,
    head: showThreshold ? ["Day", "Eggs", "60% line"] : ["Day", "Eggs"],
    rows: points.map((point) => ({
      key: point.date,
      cells: [
        formatDayShort(new Date(`${point.date}T12:00:00Z`)),
        point.eggs === null ? "No log" : `${point.eggs}`,
        showThreshold
          ? point.thresholdEggs == null
            ? "—"
            : `${point.thresholdEggs}`
          : undefined,
      ].filter((cell) => cell !== undefined) as (string | number)[],
    })),
  };

  return (
    <ChartCard
      id={id}
      title={title}
      icon={icon}
      badge={badge}
      table={table}
      summary={summary}
      empty={
        isEmpty
          ? {
              Icon: BarChart3,
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
      <EggBarsChart
        points={points}
        showThreshold={showThreshold}
        height={height}
      />
    </ChartCard>
  );
}
