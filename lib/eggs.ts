// Egg logic (docs/03-hencount.md §Logic) — pure functions, no database, no
// clock, no I/O. Money is integer kobo everywhere (00-global.md §2);
// formatting happens at the edge. Thresholds live in /lib/config.ts and are
// SAMPLES: a poultry expert must confirm them.
import { EGGS } from "./config";

export interface DayLogInput {
  /** "YYYY-MM-DD" in APP_TZ. */
  date: string;
  hens: number;
  eggs: number;
  feedKg: number;
}

export interface SaleInput {
  date?: string;
  eggs: number;
  pricePerTrayKobo: number;
}

export type Valid<T> = { ok: true; value: T } | { ok: false; message: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** One sentence saying what to fix — never a stack trace (00-global §6). */
export function validateDayLog(input: DayLogInput | null | undefined): Valid<DayLogInput> {
  if (!input) return { ok: false, message: "Enter the day's numbers." };
  if (!DATE_RE.test(input.date ?? "")) {
    return { ok: false, message: "Date must look like 2026-10-18." };
  }
  if (!Number.isInteger(input.hens) || input.hens < 1) {
    return { ok: false, message: "Hens must be a whole number of at least 1." };
  }
  if (!Number.isInteger(input.eggs) || input.eggs < 0) {
    return { ok: false, message: "Eggs must be a whole number of 0 or more." };
  }
  if (!Number.isFinite(input.feedKg) || input.feedKg <= 0) {
    return { ok: false, message: "Feed must be more than 0 kg." };
  }
  if (input.eggs > input.hens) {
    return { ok: false, message: "Eggs cannot be more than hens." };
  }
  return { ok: true, value: input };
}

export interface LogMetrics {
  layingRatePct: number;
  feedPerHenG: number;
  /** n/a (null) when no eggs were collected that day. */
  feedPerEggG: number | null;
}

/** Throws the validation sentence when the log is not valid. */
export function metricsFor(log: DayLogInput): LogMetrics {
  const checked = validateDayLog(log);
  if (!checked.ok) throw new Error(checked.message);
  return {
    layingRatePct: (log.eggs / log.hens) * 100,
    feedPerHenG: (log.feedKg * 1000) / log.hens,
    feedPerEggG: log.eggs === 0 ? null : (log.feedKg * 1000) / log.eggs,
  };
}

export type AdviceStatus =
  | "KEEP_ADDING"
  | "CHECK_HEALTH"
  | "FEW_EGGS"
  | "TOO_MUCH_FEED"
  | "GOOD";

/** Exact sentences from docs/03-hencount.md §Logic. */
export const ADVICE_MESSAGES: Record<AdviceStatus, string> = {
  KEEP_ADDING: "Add 3 days to see advice.",
  CHECK_HEALTH: "Hens eat a lot but lay few eggs. Check health and feed waste.",
  FEW_EGGS: "Few eggs. Check water, light and hen health.",
  TOO_MUCH_FEED: "Too much feed. Give a little less.",
  GOOD: "Laying well. Keep going.",
};

export interface Advice {
  status: AdviceStatus;
  message: string;
  /** Average of the last 3 logs; null while KEEP_ADDING. */
  avgLayingRatePct: number | null;
  avgFeedPerHenG: number | null;
  daysUsed: number;
}

/**
 * Advice from the day logs, oldest first. Fewer than 3 logs → KEEP_ADDING.
 * Otherwise: average the LAST 3 logs (rate and feed per hen), then in this
 * order —
 *   avgRate < 60 AND feedPerHen > 140 → CHECK_HEALTH
 *   avgRate < 60                      → FEW_EGGS
 *   feedPerHen > 140                  → TOO_MUCH_FEED
 *   else                              → GOOD
 * Boundaries are strict: exactly 60% and exactly 140 g are GOOD.
 */
export function adviceFor(logs: DayLogInput[]): Advice {
  for (const log of logs) {
    const checked = validateDayLog(log);
    if (!checked.ok) throw new Error(checked.message);
  }

  if (logs.length < EGGS.adviceMinLogs) {
    return {
      status: "KEEP_ADDING",
      message: ADVICE_MESSAGES.KEEP_ADDING,
      avgLayingRatePct: null,
      avgFeedPerHenG: null,
      daysUsed: logs.length,
    };
  }

  const last = logs.slice(-EGGS.adviceMinLogs).map(metricsFor);
  const avgLayingRatePct =
    last.reduce((sum, m) => sum + m.layingRatePct, 0) / last.length;
  const avgFeedPerHenG =
    last.reduce((sum, m) => sum + m.feedPerHenG, 0) / last.length;

  let status: AdviceStatus;
  if (avgLayingRatePct < EGGS.layingRateMinPct && avgFeedPerHenG > EGGS.feedPerHenMaxG) {
    status = "CHECK_HEALTH";
  } else if (avgLayingRatePct < EGGS.layingRateMinPct) {
    status = "FEW_EGGS";
  } else if (avgFeedPerHenG > EGGS.feedPerHenMaxG) {
    status = "TOO_MUCH_FEED";
  } else {
    status = "GOOD";
  }

  return {
    status,
    message: ADVICE_MESSAGES[status],
    avgLayingRatePct,
    avgFeedPerHenG,
    daysUsed: last.length,
  };
}

// --- Money: integer kobo (₦1 = 100 kobo) --------------------------------

/** eggRevenueDay = eggs / 30 × latest tray price, in kobo. */
export function eggRevenueKobo(eggs: number, trayPriceKobo: number): number {
  return Math.round((eggs / EGGS.perTray) * trayPriceKobo);
}

/** feedCostDay = feedKg × feed price per kg, in kobo. */
export function feedCostKobo(feedKg: number, feedPriceKobo: number): number {
  return Math.round(feedKg * feedPriceKobo);
}

export interface DayMoney {
  revenueKobo: number;
  costKobo: number;
  /** revenue − cost; negative means a loss, shown with the word "Loss". */
  profitKobo: number;
  isLoss: boolean;
}

export function dayMoney(
  input: { eggs: number; feedKg: number },
  prices: { trayPriceKobo: number; feedPriceKobo: number },
): DayMoney {
  const revenueKobo = eggRevenueKobo(input.eggs, prices.trayPriceKobo);
  const costKobo = feedCostKobo(input.feedKg, prices.feedPriceKobo);
  const profitKobo = revenueKobo - costKobo;
  return { revenueKobo, costKobo, profitKobo, isLoss: profitKobo < 0 };
}

// --- Stock: eggs in hand -------------------------------------------------

/** stockEggs = sum(eggs laid) − sum(eggs sold). */
export function stockEggs(laidEggs: number, soldEggs: number): number {
  return laidEggs - soldEggs;
}

/** Rejects selling more eggs than are in stock (and other bad sales). */
export function validateEggSale(sale: SaleInput, stock: number): Valid<SaleInput> {
  if (!sale) return { ok: false, message: "Enter how many eggs you sold." };
  if (!Number.isInteger(sale.eggs) || sale.eggs < 1) {
    return { ok: false, message: "Eggs sold must be a whole number of 1 or more." };
  }
  if (!Number.isInteger(sale.pricePerTrayKobo) || sale.pricePerTrayKobo < 1) {
    return { ok: false, message: "Price per tray must be 1 kobo or more." };
  }
  if (sale.eggs > stock) {
    return {
      ok: false,
      message: "You cannot sell more eggs than you have in stock.",
    };
  }
  return { ok: true, value: sale };
}

/** Stock value (EMV) = stock eggs / 30 × latest tray price, in kobo. */
export function stockValueKobo(stock: number, trayPriceKobo: number): number {
  return Math.round((stock / EGGS.perTray) * trayPriceKobo);
}
