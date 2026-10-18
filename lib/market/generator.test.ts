// Generator tests (00-global.md §3): determinism, the ±0.35 clamp, history
// shape, and the salt invariant — today at least one crop rises and one
// falls, so the demo shows every state. The trend printout is what you look
// at when re-picking salts (scripts/pick-salts.ts).
import { describe, expect, it } from "vitest";
import { Crop } from "@prisma/client";
import { CATALOG, getCrop } from "./catalog";
import { changePctFor, historyFor, priceOn } from "./generator";
import { addDays, todayInAppTz } from "../dates";

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
    expect(priceOn(MAIZE, new Date(Date.UTC(2026, 0, 2)))).toBe(58_719);
    expect(priceOn(MAIZE, new Date(Date.UTC(2026, 5, 15)))).toBe(60_230);
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
      return `${meta.crop.padEnd(12)} ${arrows}  today ₦${(series[series.length - 1] / 100).toLocaleString("en-NG")}`;
    });
    console.log(`\n14-day trends (oldest → today):\n${lines.join("\n")}\n`);
    expect(lines).toHaveLength(CATALOG.length);
  });

  it("today: at least one crop is rising and at least one is falling", () => {
    const today = todayInAppTz();
    const changes = CATALOG.map((meta) => changePctFor(meta.crop, today));
    expect(changes.some((pct) => (pct ?? 0) > 0)).toBe(true);
    expect(changes.some((pct) => (pct ?? 0) < 0)).toBe(true);
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
