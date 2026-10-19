// Pure data helpers for the step-5 charts (design.md §4). No database, no
// clock, no rendering: the pages fetch rows, these turn them into series.
//
// The one rule everything here obeys: empty days stay empty. A day with no
// log is null ("No log" in the table, a gap in the chart) — never a zero,
// never an average, never an invented number.
import { addDays, dateKey } from "./dates";
import { EGGS } from "./config";
import {
  eggRevenueKobo,
  feedCostKobo,
  stockEggs,
  stockValueKobo,
  type DayLogInput,
} from "./eggs";

/** The last `days` calendar days ending at `today`, oldest first. */
export function dayWindow(today: Date, days: number): string[] {
  return Array.from({ length: days }, (_, i) =>
    dateKey(addDays(today, i - (days - 1))),
  );
}

/** Eggs needed to hit the 60% laying rate on a day with this many hens. */
export function thresholdEggs(hens: number): number {
  return Math.round((hens * EGGS.layingRateMinPct) / 100);
}

export interface EggsPoint {
  /** "YYYY-MM-DD". */
  date: string;
  /** Eggs logged that day, or null when nothing was logged (a gap). */
  eggs: number | null;
  /** 60% of that day's hens, or null on a gap day. */
  thresholdEggs: number | null;
}

/**
 * One flock's eggs per day over the window, with gaps kept as null.
 * A flock never has two logs for one day (unique flockId+date), so a lookup
 * cannot collide.
 */
export function eggsSeries(
  logs: DayLogInput[],
  today: Date,
  days: number,
): EggsPoint[] {
  const byDate = new Map(logs.map((log) => [log.date, log]));
  return dayWindow(today, days).map((date) => {
    const log = byDate.get(date);
    return {
      date,
      eggs: log ? log.eggs : null,
      thresholdEggs: log ? thresholdEggs(log.hens) : null,
    };
  });
}

export interface FlockSeriesInput {
  logs: DayLogInput[];
}

/**
 * Every flock's eggs per day over one window — the dashboard's "all flocks"
 * chart. A day is the sum of the logs that exist that day; when no flock
 * logged at all, the day is a gap (null), never an invented 0.
 */
export function eggsSeriesAllFlocks(
  flocks: FlockSeriesInput[],
  today: Date,
  days: number,
): { date: string; eggs: number | null }[] {
  const byDate = new Map<string, number>();
  for (const flock of flocks) {
    for (const log of flock.logs) {
      byDate.set(log.date, (byDate.get(log.date) ?? 0) + log.eggs);
    }
  }
  return dayWindow(today, days).map((date) => ({
    date,
    eggs: byDate.has(date) ? byDate.get(date)! : null,
  }));
}

export interface ProfitPoint {
  date: string;
  /** Profit in kobo for that day; null when it cannot be computed. */
  profitKobo: number | null;
  /** True only when profitKobo exists and is negative (shown as "Loss"). */
  isLoss: boolean;
  /** Whether a log exists at all — drives the "No log" table cell. */
  logged: boolean;
}

export interface ProfitSeriesInput {
  logs: DayLogInput[];
  today: Date;
  days: number;
  /** EGGS_TRAY price per "YYYY-MM-DD" in kobo; a day missing stays a gap. */
  trayPriceByDate: Record<string, number>;
  /** Feed price in kobo per kg; null means no profit can be computed. */
  feedPriceKobo: number | null;
}

/**
 * Profit per day = eggs/30 × that day's tray price − feed kg × feed price.
 * Revenue uses the real price for the day when the feed knows it; otherwise
 * the day is a gap. Feed price is the farm's current price (the schema keeps
 * one FeedPrice row, so history is shown at today's cost).
 */
export function profitSeries(input: ProfitSeriesInput): ProfitPoint[] {
  const byDate = new Map(input.logs.map((log) => [log.date, log]));
  return dayWindow(input.today, input.days).map((date) => {
    const log = byDate.get(date);
    if (!log) return { date, profitKobo: null, isLoss: false, logged: false };

    const trayPriceKobo = input.trayPriceByDate[date];
    if (input.feedPriceKobo === null || trayPriceKobo === undefined) {
      return { date, profitKobo: null, isLoss: false, logged: true };
    }

    const revenue = eggRevenueKobo(log.eggs, trayPriceKobo);
    const cost = feedCostKobo(log.feedKg, input.feedPriceKobo);
    const profitKobo = revenue - cost;
    return { date, profitKobo, isLoss: profitKobo < 0, logged: true };
  });
}

export interface StockSlice {
  name: string;
  stockEggs: number;
  valueKobo: number;
}

export interface StockSliceInput {
  name: string;
  laidEggs: number;
  soldEggs: number;
}

/**
 * "Share of egg stock value by flock", largest first. The pie takes at most
 * `maxSlices` slices (design.md §4): with more flocks than that, the tail is
 * grouped into one "Other" slice so the chart never grows past the limit.
 * Flocks with no stock in hand are left out entirely.
 */
export function stockValueSlices(
  flocks: StockSliceInput[],
  trayPriceKobo: number,
  maxSlices: number = 5,
): StockSlice[] {
  const slices = flocks
    .map((flock) => {
      const stock = stockEggs(flock.laidEggs, flock.soldEggs);
      return {
        name: flock.name,
        stockEggs: stock,
        valueKobo: stock > 0 ? stockValueKobo(stock, trayPriceKobo) : 0,
      };
    })
    .filter((slice) => slice.stockEggs > 0)
    // Biggest share first; the name keeps equal values in a stable order.
    .sort(
      (a, b) =>
        b.valueKobo - a.valueKobo || a.name.localeCompare(b.name),
    );

  if (slices.length <= maxSlices) return slices;

  const head = slices.slice(0, maxSlices - 1);
  const tail = slices.slice(maxSlices - 1);
  const other: StockSlice = {
    name: "Other",
    stockEggs: tail.reduce((sum, slice) => sum + slice.stockEggs, 0),
    valueKobo: tail.reduce((sum, slice) => sum + slice.valueKobo, 0),
  };
  return [...head, other];
}
