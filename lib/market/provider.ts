// MarketProvider adapter (00-global.md §3):
//   SimulatedProvider is the default — the deterministic generator, persisted
//   into PriceTick (unique crop+date makes re-runs safe).
//   If MARKET_API_URL is set, LiveProvider fetches it and falls back to
//   Simulated on any failure. The badge always shows the real source.
import "server-only";
import { Crop, Unit } from "@prisma/client";
import { z } from "zod";
import { db } from "../db";
import { dateKey, todayInAppTz } from "../dates";
import { CATALOG } from "./catalog";
import { MarketTick, historyFor, tickFor } from "./generator";

export interface MarketProvider {
  source: "SIMULATED" | "LIVE";
  /** Latest price of every crop in the catalog. */
  getLatest(): Promise<MarketTick[]>;
  /** One crop's history ending today, oldest first (1–90 days). */
  getHistory(crop: Crop, days: number): Promise<MarketTick[]>;
}/**
 * Persist ticks into PriceTick so the DB mirrors the feed — in three round
 * trips instead of one per row: read what already exists, insert only the
 * missing days in a single batch, then refresh the newest day per crop (the
 * one a page reads). A 90-day chart used to fire 90 sequential upserts and
 * took ~40 s over the connection; the same read now costs one SELECT.
 */
async function persist(ticks: MarketTick[]): Promise<void> {
  if (ticks.length === 0) return;

  const asDate = (tick: MarketTick) => new Date(`${tick.date}T00:00:00.000Z`);
  const crops = [...new Set(ticks.map((tick) => tick.crop))];
  const dates = [...new Set(ticks.map(asDate))];
  const existing = await db.priceTick.findMany({
    where: { crop: { in: crops }, date: { in: dates } },
    select: { crop: true, date: true },
  });
  const seen = new Set(
    existing.map((row) => `${row.crop}|${dateKey(row.date)}`),
  );

  const missing = ticks.filter(
    (tick) => !seen.has(`${tick.crop}|${tick.date}`),
  );
  if (missing.length > 0) {
    await db.priceTick.createMany({
      data: missing.map((tick) => ({
        crop: tick.crop,
        date: asDate(tick),
        priceKobo: tick.priceKobo,
        unit: tick.unit,
        source: tick.source,
      })),
      skipDuplicates: true,
    });
  }

  // The newest day per crop is the one screens quote: always rewrite it.
  const newestPerCrop = new Map<string, MarketTick>();
  for (const tick of ticks) newestPerCrop.set(tick.crop, tick);
  for (const tick of newestPerCrop.values()) {
    await db.priceTick.upsert({
      where: { crop_date: { crop: tick.crop, date: asDate(tick) } },
      update: {
        priceKobo: tick.priceKobo,
        unit: tick.unit,
        source: tick.source,
      },
      create: {
        crop: tick.crop,
        date: asDate(tick),
        priceKobo: tick.priceKobo,
        unit: tick.unit,
        source: tick.source,
      },
    });
  }
}

export class SimulatedProvider implements MarketProvider {
  readonly source = "SIMULATED" as const;
  constructor(private readonly now: () => Date = () => new Date()) {}

  async getLatest(): Promise<MarketTick[]> {
    const today = todayInAppTz(this.now());
    const ticks = CATALOG.map((meta) => tickFor(meta.crop, today));
    await persist(ticks);
    return ticks;
  }

  async getHistory(crop: Crop, days: number): Promise<MarketTick[]> {
    const today = todayInAppTz(this.now());
    const ticks = historyFor(crop, today, days);
    await persist(ticks);
    return ticks;
  }
}

const liveTickSchema = z.object({
  crop: z.nativeEnum(Crop),
  date: z.string(),
  priceKobo: z.number().int(),
  unit: z.nativeEnum(Unit),
  source: z.enum(["SIMULATED", "LIVE"]).optional(),
});

export class LiveProvider implements MarketProvider {
  readonly source = "LIVE" as const;
  constructor(
    private readonly baseUrl: string,
    private readonly fallback: MarketProvider = new SimulatedProvider(),
  ) {}

  private async fetchPath(path: string): Promise<MarketTick[]> {
    const res = await fetch(`${this.baseUrl}${path}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Market feed returned HTTP ${res.status}`);
    const parsed = z.array(liveTickSchema).safeParse(await res.json());
    if (!parsed.success) throw new Error("Market feed returned an unexpected shape.");
    // The badge shows the real source the feed reports.
    return parsed.data.map((tick) => ({ ...tick, source: tick.source ?? "LIVE" }));
  }

  async getLatest(): Promise<MarketTick[]> {
    try {
      return await this.fetchPath("/prices");
    } catch (error) {
      console.warn("Live market feed failed, falling back to simulated:", error);
      return this.fallback.getLatest();
    }
  }

  async getHistory(crop: Crop, days: number): Promise<MarketTick[]> {
    try {
      return await this.fetchPath(`/history?crop=${crop}&days=${days}`);
    } catch (error) {
      console.warn("Live market feed failed, falling back to simulated:", error);
      return this.fallback.getHistory(crop, days);
    }
  }
}

let simulatedSingleton: SimulatedProvider | undefined;

export function getMarketProvider(): MarketProvider {
  const url = process.env.MARKET_API_URL;
  if (url) return new LiveProvider(url);
  simulatedSingleton ??= new SimulatedProvider();
  return simulatedSingleton;
}
