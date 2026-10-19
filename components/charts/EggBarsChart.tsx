"use client";

// Eggs-per-day bar chart, with the 60% laying-rate line computed from each
// day's hens (docs/03-hencount.md page 5). Days without a log stay gaps —
// the bar is missing and the tooltip says "No log".
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDayAxis } from "@/lib/dates";
import { AXIS_TEXT, GRID_COLOR, SERIES_COLORS, THRESHOLD_COLOR } from "./ChartCard";
import { ChartTooltip, type TooltipRow } from "./ChartTooltip";

export interface EggBarPoint {
  date: string;
  eggs: number | null;
  /** Absent or null on days without a log (the dashboard chart has no line). */
  thresholdEggs?: number | null;
}

const day = (date: string) => new Date(`${date}T12:00:00Z`);

export default function EggBarsChart({
  points,
  showThreshold = false,
  height = 240,
}: {
  points: EggBarPoint[];
  showThreshold?: boolean;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart
        data={points}
        margin={{ top: 10, right: 8, bottom: 4, left: 0 }}
      >
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="date"
          tick={AXIS_TEXT}
          tickFormatter={(date: string) => formatDayAxis(day(date))}
          tickMargin={6}
          minTickGap={12}
          interval="preserveStartEnd"
          axisLine={{ stroke: GRID_COLOR }}
          tickLine={false}
        />
        <YAxis
          width={52}
          tick={AXIS_TEXT}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          label={{
            value: "Eggs",
            angle: -90,
            position: "insideLeft",
            style: { fontSize: 12, fill: "#475467", textAnchor: "start" },
          }}
        />
        <Tooltip
          cursor={{ fill: "#F2F4F7" }}
          content={
            <ChartTooltip
              formatValue={(row: TooltipRow) =>
                typeof row.value === "number" ? `${row.value}` : null
              }
            />
          }
        />
        {showThreshold && (
          <Legend
            verticalAlign="bottom"
            height={26}
            iconType="plainline"
            wrapperStyle={{ fontSize: 12, color: "#475467" }}
          />
        )}
        <Bar
          dataKey="eggs"
          name="Eggs"
          fill={SERIES_COLORS[0]}
          radius={[4, 4, 0, 0]}
          maxBarSize={56}
          isAnimationActive={false}
        />
        {showThreshold && (
          <Line
            dataKey="thresholdEggs"
            name="60% line"
            stroke={THRESHOLD_COLOR}
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
