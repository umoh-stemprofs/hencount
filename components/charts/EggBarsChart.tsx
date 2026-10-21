"use client";

// Eggs-per-day bar chart, with the 60% laying-rate line computed from each
// day's hens (docs/03-hencount.md page 5). Days without a log stay gaps —
// the bar is missing and the tooltip says "No log".
//
// Restyled to stitch_.../hencount_home_desktop: ochre #9A5B00 bars with a 4px
// feel, a pale #E9EDFF grid, a dashed danger threshold line and a
// plain-English legend underneath it. The data, the gaps and the threshold
// maths are untouched.
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
import {
  ACCENT_SERIES,
  AXIS_LINE_COLOR,
  AXIS_TEXT,
  GRID_COLOR,
  THRESHOLD_COLOR,
} from "./ChartCard";
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
        <CartesianGrid stroke={GRID_COLOR} strokeWidth={1.5} vertical={false} />
        <XAxis
          dataKey="date"
          tick={AXIS_TEXT}
          tickFormatter={(date: string) => formatDayAxis(day(date))}
          tickMargin={6}
          minTickGap={12}
          interval="preserveStartEnd"
          axisLine={{ stroke: AXIS_LINE_COLOR }}
          tickLine={false}
        />
        <YAxis
          width={56}
          tick={AXIS_TEXT}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          label={{
            value: "Eggs",
            angle: -90,
            position: "insideLeft",
            style: { fontSize: 16, fill: "#475467", textAnchor: "start" },
          }}
        />
        <Tooltip
          cursor={{ fill: "#F1F3FF" }}
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
            height={32}
            iconType="plainline"
            formatter={() => (
              <span className="text-body-base text-danger">
                60% line — check your hens if eggs go below this
              </span>
            )}
            wrapperStyle={{ fontSize: 16, color: "#B42318" }}
          />
        )}
        <Bar
          dataKey="eggs"
          name="Eggs"
          fill={ACCENT_SERIES}
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
