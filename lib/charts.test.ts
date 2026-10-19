// Chart-data tests (design.md §4). The heart of them: a day without a log
// stays null forever — gaps, a single log, no logs at all, more than 5
// flocks for the pie, and a negative profit that must read "Loss".
import { describe, expect, it } from "vitest";
import {
  dayWindow,
  eggsSeries,
  eggsSeriesAllFlocks,
  profitSeries,
  stockValueSlices,
  thresholdEggs,
} from "./charts";
import type { DayLogInput } from "./eggs";

// A fixed clock so every expectation is a literal date.
const TODAY = new Date(Date.UTC(2026, 9, 19)); // Mon 19 Oct 2026
const key = (offset: number) =>
  new Date(TODAY.getTime() + offset * 86_400_000).toISOString().slice(0, 10);

const log = (offset: number, over: Partial<DayLogInput> = {}): DayLogInput => ({
  date: key(offset),
  hens: 100,
  eggs: 84,
  feedKg: 12,
  ...over,
});

describe("dayWindow", () => {
  it("returns the last N days ending today, oldest first", () => {
    expect(dayWindow(TODAY, 7)).toEqual([
      key(-6),
      key(-5),
      key(-4),
      key(-3),
      key(-2),
      key(-1),
      key(0),
    ]);
    expect(dayWindow(TODAY, 1)).toEqual([key(0)]);
  });
});

describe("eggsSeries", () => {
  it("keeps days without a log as gaps, never zeros", () => {
    const series = eggsSeries([log(-6), log(0)], TODAY, 7);
    expect(series).toHaveLength(7);
    expect(series.map((p) => p.eggs)).toEqual([
      84,
      null,
      null,
      null,
      null,
      null,
      84,
    ]);
    expect(series[1].thresholdEggs).toBeNull();
  });

  it("handles one log only", () => {
    const series = eggsSeries([log(-2, { eggs: 61, hens: 120 })], TODAY, 7);
    expect(series.filter((p) => p.eggs !== null)).toHaveLength(1);
    expect(series[4]).toEqual({
      date: key(-2),
      eggs: 61,
      // 60% of 120 hens = 72 eggs needed that day.
      thresholdEggs: 72,
    });
  });

  it("handles no logs at all", () => {
    const series = eggsSeries([], TODAY, 7);
    expect(series).toHaveLength(7);
    expect(series.every((p) => p.eggs === null)).toBe(true);
    expect(series.every((p) => p.thresholdEggs === null)).toBe(true);
  });

  it("computes the 60% threshold from that day's hens", () => {
    expect(thresholdEggs(100)).toBe(60);
    expect(thresholdEggs(85)).toBe(51); // 51 exactly
    const series = eggsSeries([log(0, { hens: 85 })], TODAY, 7);
    expect(series[6].thresholdEggs).toBe(51);
  });
});

describe("eggsSeriesAllFlocks", () => {
  it("sums the logs that exist and leaves days nobody logged as gaps", () => {
    const flocks = [
      { logs: [log(-6, { eggs: 80 }), log(0, { eggs: 85 })] },
      { logs: [log(-6, { eggs: 20 }), log(0, { eggs: 15 })] },
      { logs: [log(-2, { eggs: 60 })] },
    ];
    const series = eggsSeriesAllFlocks(flocks, TODAY, 7);
    expect(series.map((p) => p.eggs)).toEqual([
      100, // both flocks logged on day -6
      null,
      null,
      null,
      60, // only the third flock logged on day -2
      null,
      100, // day 0
    ]);
  });

  it("is all gaps when there are no flocks or no logs", () => {
    expect(
      eggsSeriesAllFlocks([], TODAY, 7).every((p) => p.eggs === null),
    ).toBe(true);
    expect(
      eggsSeriesAllFlocks([{ logs: [] }], TODAY, 7).every(
        (p) => p.eggs === null,
      ),
    ).toBe(true);
  });
});

describe("profitSeries", () => {
  const prices: Record<string, number> = Object.fromEntries(
    dayWindow(TODAY, 7).map((date) => [date, 380_000]),
  );
  const FEED_PRICE = 65_000; // ₦650 per kg

  it("computes profit from that day's tray price and the feed price", () => {
    const [point] = profitSeries({
      logs: [log(0, { eggs: 30, feedKg: 1 })],
      today: TODAY,
      days: 7,
      trayPriceByDate: prices,
      feedPriceKobo: FEED_PRICE,
    }).slice(6);
    // ₦3,800 revenue − ₦650 feed = +₦3,150.
    expect(point).toEqual({
      date: key(0),
      profitKobo: 315_000,
      isLoss: false,
      logged: true,
    });
  });

  it("marks a negative profit as a loss", () => {
    const series = profitSeries({
      logs: [log(0, { eggs: 5, feedKg: 2 })],
      today: TODAY,
      days: 7,
      trayPriceByDate: prices,
      feedPriceKobo: FEED_PRICE,
    });
    const point = series[6];
    // 5 eggs ≈ ₦633 − 2 kg feed ₦1,300 → negative.
    expect(point.profitKobo).toBeLessThan(0);
    expect(point.isLoss).toBe(true);
  });

  it("stays a gap for days with no log — the word here is null, not 0", () => {
    const series = profitSeries({
      logs: [log(-6)],
      today: TODAY,
      days: 7,
      trayPriceByDate: prices,
      feedPriceKobo: FEED_PRICE,
    });
    expect(series[0].profitKobo).not.toBeNull();
    expect(series.slice(1).every((p) => p.profitKobo === null)).toBe(true);
    expect(series[1].logged).toBe(false);
  });

  it("keeps a logged day as a gap when a price is missing", () => {
    const series = profitSeries({
      logs: [log(0)],
      today: TODAY,
      days: 7,
      trayPriceByDate: {}, // no prices at all
      feedPriceKobo: FEED_PRICE,
    });
    expect(series[6].logged).toBe(true);
    expect(series[6].profitKobo).toBeNull();
  });

  it("computes nothing when the feed price is not set", () => {
    const series = profitSeries({
      logs: [log(0)],
      today: TODAY,
      days: 7,
      trayPriceByDate: prices,
      feedPriceKobo: null,
    });
    expect(series.every((p) => p.profitKobo === null)).toBe(true);
  });
});

describe("stockValueSlices", () => {
  const tray = 380_000; // ₦3,800 per tray

  it("sorts the slices biggest value first", () => {
    const slices = stockValueSlices(
      [
        { name: "Small coop", laidEggs: 90, soldEggs: 0 },
        { name: "Big layers", laidEggs: 600, soldEggs: 0 },
        { name: "Mid layers", laidEggs: 300, soldEggs: 0 },
      ],
      tray,
    );
    expect(slices.map((s) => s.name)).toEqual([
      "Big layers",
      "Mid layers",
      "Small coop",
    ]);
    expect(slices[0].valueKobo).toBeGreaterThan(slices[1].valueKobo);
    expect(slices[1].valueKobo).toBeGreaterThan(slices[2].valueKobo);
    expect(slices).toHaveLength(3); // no "Other" needed yet
  });

  it("groups everything past the fifth slice into one Other slice", () => {
    const flocks = [1000, 900, 800, 700, 600, 500, 400].map((eggs, i) => ({
      name: `Flock ${i + 1}`,
      laidEggs: eggs,
      soldEggs: 0,
    }));
    const slices = stockValueSlices(flocks, tray, 5);
    expect(slices).toHaveLength(5);
    expect(slices[4].name).toBe("Other");
    // The four smallest flocks land in "Other".
    expect(slices[4].stockEggs).toBe(600 + 500 + 400);
    expect(slices.slice(0, 4).map((s) => s.name)).toEqual([
      "Flock 1",
      "Flock 2",
      "Flock 3",
      "Flock 4",
    ]);
  });

  it("leaves out flocks with nothing in stock", () => {
    const slices = stockValueSlices(
      [
        { name: "Sold out", laidEggs: 200, soldEggs: 200 },
        { name: "Has stock", laidEggs: 100, soldEggs: 10 },
      ],
      tray,
    );
    expect(slices.map((s) => s.name)).toEqual(["Has stock"]);
    expect(slices[0].stockEggs).toBe(90);
  });

  it("is empty when there are no flocks (no logs, no stock)", () => {
    expect(stockValueSlices([], tray)).toEqual([]);
    expect(
      stockValueSlices([{ name: "New", laidEggs: 0, soldEggs: 0 }], tray),
    ).toEqual([]);
  });
});
