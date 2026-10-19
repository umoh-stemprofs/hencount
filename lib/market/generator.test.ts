// Generator tests (00-global.md §3): determinism, the ±0.35 clamp, history
// shape, and the salt invariant — today at least one crop rises and one
// falls, so the demo shows every state. The trend printout is what you look
// at when re-picking salts (scripts/pick-salts.ts).
import { describe, expect, it } from "vitest";
import { Crop } from "@prisma/client";
import { CATALOG, getCrop } from "./catalog";
import {
  START_DATE,
  changePctFor,
  deviationSeries,
  historyFor,
  priceOn,
} from "./generator";
import { addDays, formatNaira, todayInAppTz } from "../dates";

const EGGS = getCrop(Crop.EGGS_TRAY)!;
const MAIZE = getCrop(Crop.MAIZE)!;

describe("deterministic generator", () => {
  it("same crop + date always gives the same price", () => {
    const dates = [
      new Date(Date.UTC(2026, 0, 2)),
      new Date(Date.UTC(2026, 5, 15)),
      todayInAppTz(),
    ];
    for (const meta of CATALOG) {
      for (const date of dates) {
        expect(priceOn(meta, date)).toBe(priceOn(meta, new Date(date.getTime())));
      }
    }
  });

  it("has no hidden state: a fresh call order gives the same prices", () => {
    const today = todayInAppTz();
    const forward = CATALOG.map((meta) => priceOn(meta, today));
    const reversed = [...CATALOG].reverse().map((meta) => priceOn(meta, today));
    expect(reversed).toEqual([...forward].reverse());
  });

  it("matches fixed regression values (locks the salts)", () => {
    expect(priceOn(EGGS, new Date(Date.UTC(2026, 0, 2)))).toBe(383_805);
    expect(priceOn(EGGS, new Date(Date.UTC(2026, 5, 15)))).toBe(365_068);
    expect(priceOn(MAIZE, new Date(Date.UTC(2026, 0, 2)))).toBe(60_841);
    expect(priceOn(MAIZE, new Date(Date.UTC(2026, 5, 15)))).toBe(57_420);
  });

  it("keeps every price inside the ±0.35 clamp", () => {
    const start = new Date(Date.UTC(2026, 0, 1));
    for (const meta of CATALOG) {
      for (let k = 1; k <= 40; k++) {
        const price = priceOn(meta, addDays(start, k));
        expect(price).toBeGreaterThan(0);
        expect(price).toBeLessThanOrEqual(Math.round(meta.baseKobo * Math.exp(0.35)));
        expect(price).toBeGreaterThanOrEqual(Math.round(meta.baseKobo * Math.exp(-0.35)));
      }
    }
  });
});

describe("trends", () => {
  it("prints the 14-day trend for each crop", () => {
    const today = todayInAppTz();
    const lines = CATALOG.map((meta) => {
      const series = historyFor(meta.crop, today, 14).map((t) => t.priceKobo);
      const arrows = series
        .slice(1)
        .map((p, i) => (p > series[i] ? "↑" : p < series[i] ? "↓" : "→"))
        .join("");
      return `${meta.crop.padEnd(12)} ${arrows}  today ${formatNaira(series[series.length - 1])}`;
    });
    console.log(`\n14-day trends (oldest → today):\n${lines.join("\n")}\n`);
    expect(lines).toHaveLength(CATALOG.length);
  });

  it("every day of 2026-2027: at least one crop rises and one falls", () => {
    // Scanned day by day, NOT "today": the demo must show both directions
    // on whatever day a judge runs it. The salts were searched for exactly
    // this (scripts/pick-salts.ts scans three years and prints 0 failures).
    // One incremental series per crop — changePctFor would rescan from x[0]
    // for every day and take minutes.
    const end = new Date(Date.UTC(2027, 11, 31));
    const lastK = Math.round(
      (end.getTime() - START_DATE.getTime()) / 86_400_000,
    );
    const priceSeries = CATALOG.map((meta) =>
      deviationSeries(meta, lastK).map((x) =>
        Math.round(meta.baseKobo * Math.exp(x)),
      ),
    );

    const bad: string[] = [];
    for (let k = 2; k <= lastK; k++) {
      let up = false;
      let down = false;
      for (const prices of priceSeries) {
        if (prices[k] > prices[k - 1]) up = true;
        else if (prices[k] < prices[k - 1]) down = true;
        if (up && down) break;
      }
      if (!up || !down) {
        bad.push(
          new Date(START_DATE.getTime() + k * 86_400_000)
            .toISOString()
            .slice(0, 10),
        );
      }
    }
    expect(bad).toEqual([]);
  });
});

describe("history", () => {
  it("returns `days` ticks ending today, oldest first, all distinct days", () => {
    const today = todayInAppTz();
    const ticks = historyFor(Crop.EGGS_TRAY, today, 30);
    expect(ticks).toHaveLength(30);
    expect(ticks[29].date).toBe(today.toISOString().slice(0, 10));
    expect(ticks[0].date).toBe(addDays(today, -29).toISOString().slice(0, 10));
    expect(new Set(ticks.map((t) => t.date)).size).toBe(30);
    expect(ticks.every((t) => t.source === "SIMULATED")).toBe(true);
  });

  it("rejects days outside 1–90", () => {
    const today = todayInAppTz();
    expect(() => historyFor(Crop.MAIZE, today, 0)).toThrow();
    expect(() => historyFor(Crop.MAIZE, today, 91)).toThrow();
  });
});
