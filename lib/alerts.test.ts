// Heat alert tests (docs/03-hencount.md): forecast maxC ≥ 34 →
// "Hot day. Give cool water. Eggs may drop." Threshold is a sample value in
// /lib/config.ts; a poultry expert must confirm it.
import { describe, expect, it } from "vitest";
import { heatAlert } from "./alerts";
import type { WeatherDay } from "./weather/types";

function day(overrides: Partial<WeatherDay> & { date: string }): WeatherDay {
  return { minC: 24, maxC: 30, rainMm: 0, rainChancePct: 10, ...overrides };
}

describe("heatAlert", () => {
  it("raises no alert when every day stays below the threshold", () => {
    const daily = [day({ date: "2026-10-18", maxC: 33.9 }), day({ date: "2026-10-19", maxC: 30 })];
    expect(heatAlert(daily)).toBeNull();
  });

  it("raises the heat alert at exactly 34 °C", () => {
    const alert = heatAlert([day({ date: "2026-10-18", maxC: 34 })]);
    expect(alert).not.toBeNull();
    expect(alert?.type).toBe("HEAT");
    expect(alert?.date).toBe("2026-10-18");
    expect(alert?.maxC).toBe(34);
    expect(alert?.message).toBe("Hot day. Give cool water. Eggs may drop.");
  });

  it("names the first hot day, not the hottest", () => {
    const alert = heatAlert([
      day({ date: "2026-10-18", maxC: 31 }),
      day({ date: "2026-10-19", maxC: 35 }),
      day({ date: "2026-10-20", maxC: 36 }),
    ]);
    expect(alert?.date).toBe("2026-10-19");
  });

  it("handles an empty forecast", () => {
    expect(heatAlert([])).toBeNull();
  });
});
