"use client";

// Profit-per-day line chart (docs/03-hencount.md page 5). One continuous
// blue line over the days that exist; each LOSS day is marked with a dot in
// the danger color, the dashed zero line separates the two sides, and the
// tooltip prints the word "Loss" in red. A day with no log is a gap that
// says "No log" — never an invented 0.
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReactNode } from "react";
import { formatDayAxis, formatNaira } from "@/lib/dates";
import {
  AXIS_TEXT,
  GRID_COLOR,
  LOSS_COLOR,
  SERIES_COLORS,
} from "./ChartCard";
import { ChartTooltip, type TooltipRow } from "./ChartTooltip";
import type { ProfitPoint } from "@/lib/charts";

const day = (date: string) => new Date(`${date}T12:00:00Z`);

const nairaTick = (value: number) => formatNaira(value);

interface ProfitDotProps {
  cx?: number;
  cy?: number;
  payload?: ProfitPoint;
  index?: number;
}

/** Gain days: small blue dot. Loss days: bigger dot in the danger color. */
function profitDot(props: ProfitDotProps): ReactNode {
  const { cx, cy, payload } = props;
  if (cx === undefined || cy === undefined) return null;
  const isLoss = payload?.isLoss ?? false;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={isLoss ? 5 : 3.5}
      fill={isLoss ? LOSS_COLOR : SERIES_COLORS[0]}
      strokeWidth={0}
    />
  );
}

export default function ProfitLineChart({
  points,
  height = 240,
}: {
  points: ProfitPoint[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={points} margin={{ top: 10, right: 8, bottom: 4, left: 0 }}>
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
          width={62}
          tick={AXIS_TEXT}
          tickFormatter={nairaTick}
          axisLine={false}
          tickLine={false}
          label={{
            value: "₦",
            angle: -90,
            position: "insideLeft",
            style: { fontSize: 12, fill: "#475467", textAnchor: "start" },
          }}
        />
        {/* Zero: the line between earning and losing. */}
        <ReferenceLine y={0} stroke="#475467" strokeWidth={1} />
        <Tooltip
          cursor={{ stroke: GRID_COLOR }}
          content={
            <ChartTooltip
              hideNames
              formatValue={(row: TooltipRow) => {
                if (typeof row.value !== "number") return null;
                const value = row.value;
                return value < 0 ? (
                  <span style={{ color: LOSS_COLOR, fontWeight: 600 }}>
                    Loss {formatNaira(Math.abs(value))}
                  </span>
                ) : (
                  formatNaira(value)
                );
              }}
            />
          }
        />
        <Line
          dataKey="profitKobo"
          name="Profit"
          stroke={SERIES_COLORS[0]}
          strokeWidth={2}
          dot={profitDot}
          connectNulls={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
