// Dashboard numbers (docs/03-hencount.md §2: today's eggs, stock value,
// profit today) — a pure function over already-fetched, ownership-checked
// rows. Composes the tested maths from /lib/eggs.ts; money stays in kobo.
import { dayMoney, stockEggs, stockValueKobo, type DayMoney } from "./eggs";

export interface DashboardFlockInput {
  logs: { date: string; eggs: number; feedKg: number }[];
  sales: { eggs: number }[];
}

export interface DashboardInput {
  flocks: DashboardFlockInput[];
  /** "YYYY-MM-DD" of today in APP_TZ. */
  todayKey: string;
  /** Latest EGGS_TRAY price in kobo, or null when no price is known. */
  trayPriceKobo: number | null;
  /** The farm's feed price in kobo per kg, or null when not set. */
  feedPriceKobo: number | null;
}

export interface DashboardStats {
  hasAnyLog: boolean;
  hasTodayLog: boolean;
  todayEggs: number;
  todayFeedKg: number;
  stockEggs: number;
  /** EMV of the egg stock; null when no tray price is known. */
  profit: DayMoney | null;
  stockValueKobo: number | null;
}

export function computeDashboard(input: DashboardInput): DashboardStats {
  let todayEggs = 0;
  let todayFeedKg = 0;
  let hasTodayLog = false;
  let laid = 0;
  let sold = 0;

  for (const flock of input.flocks) {
    for (const log of flock.logs) {
      laid += log.eggs;
      if (log.date === input.todayKey) {
        hasTodayLog = true;
        todayEggs += log.eggs;
        todayFeedKg += log.feedKg;
      }
    }
    for (const sale of flock.sales) sold += sale.eggs;
  }

  const stock = stockEggs(laid, sold);
  const stockValue =
    input.trayPriceKobo === null
      ? null
      : stockValueKobo(stock, input.trayPriceKobo);

  // Profit today only exists when today's numbers are logged AND both
  // prices are known; the page explains what is missing otherwise.
  let profit: DayMoney | null = null;
  if (hasTodayLog && input.trayPriceKobo !== null && input.feedPriceKobo !== null) {
    profit = dayMoney(
      { eggs: todayEggs, feedKg: todayFeedKg },
      { trayPriceKobo: input.trayPriceKobo, feedPriceKobo: input.feedPriceKobo },
    );
  }

  return {
    hasAnyLog: input.flocks.some((f) => f.logs.length > 0),
    hasTodayLog,
    todayEggs,
    todayFeedKg,
    stockEggs: stock,
    stockValueKobo: stockValue,
    profit,
  };
}
