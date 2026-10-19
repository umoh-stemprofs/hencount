// Money formatting tests. HenCount is naira-only: every screen must render
// the exact same "₦12,500" (00-global.md §2), negatives keep the word-able
// "-₦500", and no locale can swap the sign for "$" or "NGN".
import { describe, expect, it } from "vitest";
import { formatNaira } from "./dates";

describe("formatNaira", () => {
  it("formats kobo as whole naira with grouping (00-global.md §2)", () => {
    expect(formatNaira(1_250_000)).toBe("₦12,500");
    expect(formatNaira(380_000)).toBe("₦3,800");
    expect(formatNaira(100_000_000)).toBe("₦1,000,000");
  });

  it("starts at ₦0 and rounds half a naira up", () => {
    expect(formatNaira(0)).toBe("₦0");
    expect(formatNaira(50)).toBe("₦1");
    expect(formatNaira(150)).toBe("₦2");
  });

  it("keeps the minus sign in front of the ₦ for a loss", () => {
    expect(formatNaira(-50_000)).toBe("-₦500");
    expect(formatNaira(-75)).toBe("-₦1");
  });

  it("never shows any sign but ₦ — no $, no NGN, no bare numbers", () => {
    const samples = [
      0,
      1,
      99,
      100,
      125_000,
      -125_000,
      4_162_500,
      999_999_999,
    ];
    for (const kobo of samples) {
      const text = formatNaira(kobo);
      expect(text).toContain("₦");
      expect(text.replace("-", "")).toMatch(/^₦[\d,]+$/);
      expect(text).not.toContain("$");
      expect(text.toUpperCase()).not.toContain("NGN");
    }
  });

  it("round-trips with the kobo maths used by /lib/eggs.ts", () => {
    // ₦3,800 per tray = 380,000 kobo; 30 eggs in a tray.
    expect(formatNaira(380_000 / 30)).toBe("₦127");
  });
});
