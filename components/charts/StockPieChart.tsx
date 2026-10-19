"use client";

// "Share of egg stock value by flock" pie (docs/03-hencount.md page 2 and
// design.md §4: pie max 5 slices, the rest grouped as "Other" by /lib/charts).
// Colors come from the color-blind safe palette; every slice also appears
// word-for-word in the legend under the chart, so color is never alone.
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatNaira } from "@/lib/dates";
import { SERIES_COLORS } from "./ChartCard";
import type { StockSlice } from "@/lib/charts";

export default function StockPieChart({
  slices,
  height = 220,
}: {
  slices: StockSlice[];
  height?: number;
}) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={slices}
            dataKey="valueKobo"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            stroke="#FFFFFF"
            strokeWidth={2}
            isAnimationActive={false}
          >
            {slices.map((slice, index) => (
              <Cell
                key={slice.name}
                fill={SERIES_COLORS[index % SERIES_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              const slice = payload?.[0]?.payload as StockSlice | undefined;
              if (!active || !slice) return null;
              return (
                <div className="rounded-input border border-border bg-surface px-3 py-2 shadow-card">
                  <p className="text-sm font-medium text-text">{slice.name}</p>
                  <p className="text-sm tabular-nums text-text">
                    {formatNaira(slice.valueKobo)}
                  </p>
                  <p className="text-xs tabular-nums text-muted">
                    {slice.stockEggs} eggs in stock
                  </p>
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Direct labels: the same slices as words, wrapped for 390 px. */}
      <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {slices.map((slice, index) => (
          <li
            key={slice.name}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{
                  backgroundColor: SERIES_COLORS[index % SERIES_COLORS.length],
                }}
                aria-hidden="true"
              />
              <span className="truncate text-text">{slice.name}</span>
            </span>
            <span className="shrink-0 tabular-nums text-muted">
              {formatNaira(slice.valueKobo)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
