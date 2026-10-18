// Tests for /lib/eggs.ts (docs/03-hencount.md §Logic and §Steps 3):
// eggs > hens · 0 eggs · under 3 logs · exactly 3 logs · every advice
// message · exact boundaries (rate 60, feed 140) · sale larger than stock
// rejected · negative profit · stock-value rounding.
import { describe, expect, it } from "vitest";
import {
  ADVICE_MESSAGES,
  adviceFor,
  dayMoney,
  eggRevenueKobo,
  feedCostKobo,
  metricsFor,
  stockEggs,
  stockValueKobo,
  validateDayLog,
  validateEggSale,
  type DayLogInput,
} from "./eggs";

const log = (over: Partial<DayLogInput> = {}): DayLogInput => ({
  date: "2026-10-18",
  hens: 100,
  eggs: 85,
  feedKg: 12,
  ...over,
});

/** n identical valid logs (GOOD numbers unless overridden). */
const sameLogs = (n: number, over: Partial<DayLogInput> = {}): DayLogInput[] =>
  Array.from({ length: n }, (_, i) => log({ date: `2026-10-${10 + i}`, ...over }));

const TRAY_3800 = 380_000; // ₦3,800 per tray of 30
const FEED_1100_PER_KG = 110_000; // ₦1,100 per kg

describe("validateDayLog", () => {
  it("accepts a valid log", () => {
    const result = validateDayLog(log());
    expect(result.ok).toBe(true);
  });

  it("rejects eggs more than hens with the exact sentence", () => {
    const result = validateDayLog(log({ hens: 80, eggs: 85 }));
    expect(result).toEqual({
      ok: false,
      message: "Eggs cannot be more than hens.",
    });
  });

  it("rejects hens below 1", () => {
    const result = validateDayLog(log({ hens: 0 }));
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.message).toBe("Hens must be a whole number of at least 1.");
  });

  it("rejects negative eggs and non-whole numbers", () => {
    expect(validateDayLog(log({ eggs: -1 })).ok).toBe(false);
    expect(validateDayLog(log({ hens: 10.5 })).ok).toBe(false);
    expect(validateDayLog(log({ eggs: 12.5 })).ok).toBe(false);
  });

  it("rejects feed of 0 kg and negative feed", () => {
    const zero = validateDayLog(log({ feedKg: 0 }));
    expect(zero).toEqual({ ok: false, message: "Feed must be more than 0 kg." });
    expect(validateDayLog(log({ feedKg: -2 })).ok).toBe(false);
  });

  it("rejects a date that is not YYYY-MM-DD", () => {
    const result = validateDayLog(log({ date: "18/10/2026" }));
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.message).toBe("Date must look like 2026-10-18.");
  });
});

describe("metricsFor", () => {
  it("computes laying rate, feed per hen and feed per egg", () => {
    const m = metricsFor(log({ eggs: 85, hens: 100, feedKg: 12 }));
    expect(m.layingRatePct).toBe(85);
    expect(m.feedPerHenG).toBe(120);
    expect(m.feedPerEggG).toBeCloseTo(141.176, 3);
  });

  it("handles zero eggs: rate 0 and feed per egg is n/a", () => {
    const m = metricsFor(log({ eggs: 0, feedKg: 10 }));
    expect(m.layingRatePct).toBe(0);
    expect(m.feedPerHenG).toBe(100);
    expect(m.feedPerEggG).toBeNull();
  });

  it("throws the validation sentence for an invalid log", () => {
    expect(() => metricsFor(log({ hens: 80, eggs: 85 }))).toThrow(
      "Eggs cannot be more than hens.",
    );
  });
});

describe("adviceFor", () => {
  it("KEEP_ADDING with the exact sentence for fewer than 3 logs", () => {
    for (const n of [0, 1, 2]) {
      const advice = adviceFor(sameLogs(n));
      expect(advice.status).toBe("KEEP_ADDING");
      expect(advice.message).toBe("Add 3 days to see advice.");
      expect(advice.avgLayingRatePct).toBeNull();
      expect(advice.avgFeedPerHenG).toBeNull();
      expect(advice.daysUsed).toBe(n);
    }
  });

  it("advice starts at exactly 3 logs and averages all 3", () => {
    const advice = adviceFor(sameLogs(3)); // 85% rate, 120 g/hen
    expect(advice.status).toBe("GOOD");
    expect(advice.daysUsed).toBe(3);
    expect(advice.avgLayingRatePct).toBe(85);
    expect(advice.avgFeedPerHenG).toBe(120);
  });

  it("averages only the last 3 logs when there are more", () => {
    const logs = [
      log({ date: "2026-10-09", eggs: 0, feedKg: 60 }), // rate 0%, 600 g/hen — ignored
      ...sameLogs(3),
    ];
    const advice = adviceFor(logs);
    expect(advice.status).toBe("GOOD");
    expect(advice.avgLayingRatePct).toBe(85);
    expect(advice.avgFeedPerHenG).toBe(120);
  });

  it("FEW_EGGS: rate below 60 with normal feed", () => {
    const advice = adviceFor(sameLogs(3, { eggs: 50, feedKg: 12 }));
    expect(advice.status).toBe("FEW_EGGS");
    expect(advice.message).toBe("Few eggs. Check water, light and hen health.");
  });

  it("TOO_MUCH_FEED: feed above 140 g/hen with a good rate", () => {
    const advice = adviceFor(sameLogs(3, { eggs: 80, feedKg: 15 }));
    expect(advice.status).toBe("TOO_MUCH_FEED");
    expect(advice.message).toBe("Too much feed. Give a little less.");
  });

  it("CHECK_HEALTH: low rate AND too much feed, checked before the other two", () => {
    const advice = adviceFor(sameLogs(3, { hens: 1000, eggs: 500, feedKg: 150 }));
    expect(advice.status).toBe("CHECK_HEALTH");
    expect(advice.message).toBe(
      "Hens eat a lot but lay few eggs. Check health and feed waste.",
    );
  });

  it("GOOD: laying well, keep going", () => {
    const advice = adviceFor(sameLogs(3));
    expect(advice.status).toBe("GOOD");
    expect(advice.message).toBe("Laying well. Keep going.");
  });

  it("boundaries are strict: rate exactly 60 and feed exactly 140 is GOOD", () => {
    const advice = adviceFor(sameLogs(3, { eggs: 60, feedKg: 14 })); // 60%, 140 g
    expect(advice.avgLayingRatePct).toBe(60);
    expect(advice.avgFeedPerHenG).toBe(140);
    expect(advice.status).toBe("GOOD");
  });

  it("rate exactly 60 with feed 141 g is TOO_MUCH_FEED", () => {
    const advice = adviceFor(
      sameLogs(3, { hens: 1000, eggs: 600, feedKg: 141 }), // 60%, 141 g
    );
    expect(advice.status).toBe("TOO_MUCH_FEED");
  });

  it("rate 59.9 with feed exactly 140 g is FEW_EGGS", () => {
    const advice = adviceFor(
      sameLogs(3, { hens: 1000, eggs: 599, feedKg: 140 }), // 59.9%, 140 g
    );
    expect(advice.status).toBe("FEW_EGGS");
  });

  it("rate 59.9 with feed 141 g is CHECK_HEALTH", () => {
    const advice = adviceFor(
      sameLogs(3, { hens: 1000, eggs: 599, feedKg: 141 }), // 59.9%, 141 g
    );
    expect(advice.status).toBe("CHECK_HEALTH");
  });

  it("zero eggs for 3 days gives FEW_EGGS, not a crash", () => {
    const advice = adviceFor(sameLogs(3, { eggs: 0, feedKg: 10 }));
    expect(advice.status).toBe("FEW_EGGS");
    expect(advice.avgLayingRatePct).toBe(0);
  });

  it("throws the validation sentence when a log is invalid", () => {
    expect(() => adviceFor(sameLogs(3, { hens: 80, eggs: 85 }))).toThrow(
      "Eggs cannot be more than hens.",
    );
  });
});

describe("money (integer kobo)", () => {
  it("egg revenue = eggs / 30 × tray price, rounded to whole kobo", () => {
    expect(eggRevenueKobo(30, TRAY_3800)).toBe(380_000);
    expect(eggRevenueKobo(15, TRAY_3800)).toBe(190_000);
    expect(eggRevenueKobo(1, TRAY_3800)).toBe(12_667); // 12,666.67 → 12,667
    expect(eggRevenueKobo(0, TRAY_3800)).toBe(0);
  });

  it("feed cost = feedKg × price per kg, in kobo", () => {
    expect(feedCostKobo(12, FEED_1100_PER_KG)).toBe(1_320_000);
    expect(feedCostKobo(12.5, FEED_1100_PER_KG)).toBe(1_375_000);
    expect(feedCostKobo(0.5, FEED_1100_PER_KG)).toBe(55_000);
  });

  it("profit can be negative and is flagged as a loss", () => {
    const money = dayMoney(
      { eggs: 10, feedKg: 12 },
      { trayPriceKobo: TRAY_3800, feedPriceKobo: FEED_1100_PER_KG },
    );
    expect(money.revenueKobo).toBe(126_667);
    expect(money.costKobo).toBe(1_320_000);
    expect(money.profitKobo).toBe(-1_193_333);
    expect(money.isLoss).toBe(true);
  });

  it("a profitable day is not a loss", () => {
    const money = dayMoney(
      { eggs: 85, feedKg: 4 },
      { trayPriceKobo: TRAY_3800, feedPriceKobo: FEED_1100_PER_KG },
    );
    expect(money.profitKobo).toBeGreaterThan(0);
    expect(money.isLoss).toBe(false);
  });

  it("zero eggs with feed still gives revenue 0 and the full cost", () => {
    const money = dayMoney(
      { eggs: 0, feedKg: 12 },
      { trayPriceKobo: TRAY_3800, feedPriceKobo: FEED_1100_PER_KG },
    );
    expect(money.revenueKobo).toBe(0);
    expect(money.profitKobo).toBe(-1_320_000);
  });
});

describe("stock", () => {
  it("stock = eggs laid − eggs sold", () => {
    expect(stockEggs(589, 210)).toBe(379);
    expect(stockEggs(0, 0)).toBe(0);
  });

  it("rejects a sale larger than the stock, with the exact sentence", () => {
    const result = validateEggSale({ eggs: 380, pricePerTrayKobo: TRAY_3800 }, 379);
    expect(result).toEqual({
      ok: false,
      message: "You cannot sell more eggs than you have in stock.",
    });
  });

  it("allows selling exactly the stock, rejects 0 or negative eggs", () => {
    expect(validateEggSale({ eggs: 379, pricePerTrayKobo: TRAY_3800 }, 379).ok).toBe(true);
    const zero = validateEggSale({ eggs: 0, pricePerTrayKobo: TRAY_3800 }, 379);
    expect(zero).toEqual({
      ok: false,
      message: "Eggs sold must be a whole number of 1 or more.",
    });
    expect(validateEggSale({ eggs: -5, pricePerTrayKobo: TRAY_3800 }, 379).ok).toBe(false);
  });

  it("rejects a zero price per tray", () => {
    const result = validateEggSale({ eggs: 10, pricePerTrayKobo: 0 }, 379);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.message).toBe("Price per tray must be 1 kobo or more.");
  });

  it("stock value = stock / 30 × tray price, rounded to whole kobo", () => {
    expect(stockValueKobo(45, TRAY_3800)).toBe(570_000); // 1.5 trays exactly
    expect(stockValueKobo(44, TRAY_3800)).toBe(557_333); // 557,333.33 → 557,333
    expect(stockValueKobo(1, TRAY_3800)).toBe(12_667); // 12,666.67 → 12,667
    expect(stockValueKobo(379, TRAY_3800)).toBe(4_800_667);
    expect(stockValueKobo(0, TRAY_3800)).toBe(0);
  });
});

describe("ADVICE_MESSAGES", () => {
  it("holds the exact sentences from the app file", () => {
    expect(ADVICE_MESSAGES).toEqual({
      KEEP_ADDING: "Add 3 days to see advice.",
      CHECK_HEALTH: "Hens eat a lot but lay few eggs. Check health and feed waste.",
      FEW_EGGS: "Few eggs. Check water, light and hen health.",
      TOO_MUCH_FEED: "Too much feed. Give a little less.",
      GOOD: "Laying well. Keep going.",
    });
  });
});
