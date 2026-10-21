"use client";

// Egg-tray price line chart (docs/design.md S-MARKET: 7/30/90-day toggle,
// units on axes), restyled to stitch_.../hencount_prices_today_desktop:
// a 4px ochre stroke with round joins, white point circles ringed in ochre,
// and a solid ochre dot on the newest point. The feed, the window and the
// gaps are unchanged.
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDayAxis, formatNaira } from "@/lib/dates";
import {
  ACCENT_SERIES,
  AXIS_LINE_COLOR,
  AXIS_TEXT,
  GRID_COLOR,
} from "./ChartCard";
import { ChartTooltip, type TooltipRow } from "./ChartTooltip";

export interface PricePoint {
  date: string;
  priceKobo: number;
}

const day = (date: string) => new Date(`${date}T12:00:00Z`);

/** Hollow ochre-ringed point — the mockups' default marker. */
const HOLLOW_DOT = {
  r: 6,
  fill: "#FFFFFF",
  stroke: ACCENT_SERIES,
  strokeWidth: 3,
} as const;

export default function PriceLineChart({
  points,
  height = 260,
}: {
  points: PricePoint[];
  height?: number;
}) {
  const showDots = points.length <= 7;
  const last = points.length > 0 ? points[points.length - 1] : null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={points} margin={{ top: 10, right: 8, bottom: 4, left: 0 }}>
        <CartesianGrid stroke={GRID_COLOR} strokeWidth={1.5} vertical={false} />
        <XAxis
          dataKey="date"
          tick={AXIS_TEXT}
          tickFormatter={(date: string) => formatDayAxis(day(date))}
          tickMargin={6}
          minTickGap={16}
          interval="preserveStartEnd"
          axisLine={{ stroke: AXIS_LINE_COLOR }}
          tickLine={false}
        />
        <YAxis
          width={72}
          tick={AXIS_TEXT}
          tickFormatter={(value: number) => formatNaira(value)}
          axisLine={false}
          tickLine={false}
          domain={["auto", "auto"]}
          label={{
            value: "₦ per tray",
            angle: -90,
            position: "insideLeft",
            style: { fontSize: 16, fill: "#475467", textAnchor: "start" },
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
          stroke={ACCENT_SERIES}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          dot={showDots ? HOLLOW_DOT : false}
          activeDot={{
            r: 7,
            fill: ACCENT_SERIES,
            stroke: "#FFFFFF",
            strokeWidth: 3,
          }}
          connectNulls={false}
          isAnimationActive={false}
        />
        {/* The mockup fills the newest point solid so "today" reads at a
            glance. Drawn as a reference dot because recharts' functional
            `dot` prop does not expose the point index. */}
        {showDots && last && (
          <ReferenceDot
            x={last.date}
            y={last.priceKobo}
            r={7}
            fill={ACCENT_SERIES}
            stroke="#FFFFFF"
            strokeWidth={3}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
