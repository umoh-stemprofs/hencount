// Deterministic price generator (00-global.md §3):
//   START_DATE 2026-01-01 · x[0] = 0
//   x[k] = x[k-1] − 0.03·x[k-1] + e[k],  e[k] = (rand − 0.5) · 2 · 0.025
//   rand = mulberry32(hash(crop + salt + k))(),  x clamped to ±0.35
//   price = round(base × exp(x))
// Same crop + salt + date always gives the same price, in any process.
import { Crop, Unit } from "@prisma/client";
import { addDays } from "../dates";
import { CropMeta, getCrop } from "./catalog";

export const START_DATE = new Date(Date.UTC(2026, 0, 1));
const DAY_MS = 86_400_000;
const MEAN_REVERT = 0.03;
const NOISE_LIMIT = 0.025;
const X_CLAMP = 0.35;

/** FNV-1a 32-bit hash of a string. */
export function hashString(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 PRNG — returns a function producing numbers in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Day number since START_DATE. Negative means "before the feed starts". */
export function dayIndex(date: Date): number {
  return Math.floor((date.getTime() - START_DATE.getTime()) / DAY_MS);
}

function clampX(x: number): number {
  return Math.max(-X_CLAMP, Math.min(X_CLAMP, x));
}

/** Deviation x[k] for day k, recomputed from x[0] = 0. */
export function deviationOnDay(meta: CropMeta, k: number): number {
  let x = 0;
  for (let i = 1; i <= k; i++) {
    const rand = mulberry32(hashString(`${meta.crop}${meta.salt}${i}`))();
    const e = (rand - 0.5) * 2 * NOISE_LIMIT;
    x = clampX(x - MEAN_REVERT * x + e);
  }
  return x;
}

/** Price in integer kobo for one crop on one day. */
export function priceOn(meta: CropMeta, date: Date): number {
  const k = dayIndex(date);
  if (k < 1) {
    throw new Error(`No price before the feed starts (2026-01-02); got ${date.toISOString().slice(0, 10)}.`);
  }
  const x = deviationOnDay(meta, k);
  return Math.round(meta.baseKobo * Math.exp(x));
}

export interface MarketTick {
  crop: Crop;
  /** "YYYY-MM-DD" in APP_TZ. */
  date: string;
  priceKobo: number;
  unit: Unit;
  source: "SIMULATED" | "LIVE";
}

/** One simulated tick for one crop on one day. */
export function tickFor(crop: Crop, date: Date): MarketTick {
  const meta = getCrop(crop);
  if (!meta) throw new Error(`Unknown crop: ${crop}`);
  return {
    crop,
    date: date.toISOString().slice(0, 10),
    priceKobo: priceOn(meta, date),
    unit: meta.unit,
    source: "SIMULATED",
  };
}

/** `days` ticks ending at `endDate` (inclusive), oldest first. Max 90. */
export function historyFor(crop: Crop, endDate: Date, days: number): MarketTick[] {
  if (days < 1 || days > 90) throw new Error("days must be between 1 and 90.");
  const ticks: MarketTick[] = [];
  for (let i = 0; i < days; i++) {
    ticks.push(tickFor(crop, addDays(endDate, i - (days - 1))));
  }
  return ticks;
}

/** Percentage change of a crop vs the previous day, or null before the feed. */
export function changePctFor(crop: Crop, date: Date): number | null {
  const meta = getCrop(crop);
  if (!meta) throw new Error(`Unknown crop: ${crop}`);
  const k = dayIndex(date);
  if (k < 2) return null;
  const today = priceOn(meta, date);
  const yesterday = priceOn(meta, addDays(date, -1));
  return ((today - yesterday) / yesterday) * 100;
}
