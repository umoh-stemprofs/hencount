"use client";

// Egg-tray price line chart (design.md S-MARKET: 7/30/90-day toggle, units
// on axes). The feed is simulated, so the same date always draws the same
// point; the card carries the Simulated badge.
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDayAxis, formatNaira } from "@/lib/dates";
import { AXIS_TEXT, GRID_COLOR, SERIES_COLORS } from "./ChartCard";
import { ChartTooltip, type TooltipRow } from "./ChartTooltip";

export interface PricePoint {
  date: string;
  priceKobo: number;
}

const day = (date: string) => new Date(`${date}T12:00:00Z`);

export default function PriceLineChart({
  points,
  height = 260,
}: {
  points: PricePoint[];
  height?: number;
}) {
  const showDots = points.length <= 7;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={points} margin={{ top: 10, right: 8, bottom: 4, left: 0 }}>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="date"
          tick={AXIS_TEXT}
          tickFormatter={(date: string) => formatDayAxis(day(date))}
          tickMargin={6}
          minTickGap={16}
          interval="preserveStartEnd"
          axisLine={{ stroke: GRID_COLOR }}
          tickLine={false}
        />
        <YAxis
          width={62}
          tick={AXIS_TEXT}
          tickFormatter={(value: number) => formatNaira(value)}
          axisLine={false}
          tickLine={false}
          domain={["auto", "auto"]}
          label={{
            value: "₦ per tray",
            angle: -90,
            position: "insideLeft",
            style: { fontSize: 12, fill: "#475467", textAnchor: "start" },
          }}
        />
        <Tooltip
          cursor={{ stroke: GRID_COLOR }}
          content={
            <ChartTooltip
              formatValue={(row: TooltipRow) =>
                typeof row.value === "number"
                  ? `${formatNaira(row.value)} per tray`
                  : null
              }
            />
          }
        />
        <Line
          dataKey="priceKobo"
          name="Price"
          stroke={SERIES_COLORS[0]}
          strokeWidth={2}
          dot={
            showDots
              ? { r: 3, fill: SERIES_COLORS[0], strokeWidth: 0 }
              : false
          }
          activeDot={{ r: 4 }}
          connectNulls={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
