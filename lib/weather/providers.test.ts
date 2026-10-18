// Response-shape tests: both providers are validated with Zod and folded
// into the same WeatherData shape; anything unexpected is rejected.
import { describe, expect, it } from "vitest";
import { parseOpenMeteo, wmoText } from "./openMeteo";
import { parseOwm } from "./owm";

const FETCHED_AT = new Date("2026-10-18T10:00:00.000Z");

const openMeteoSample = {
  current: {
    temperature_2m: 30.5,
    relative_humidity_2m: 74,
    wind_speed_10m: 11.2,
    weather_code: 2,
  },
  daily: {
    time: ["2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22"],
    temperature_2m_max: [33, 34.2, 32, 31, 30],
    temperature_2m_min: [24, 25, 24, 23, 23],
    precipitation_sum: [0, 1.5, 0, 0, 4],
    precipitation_probability_max: [10, 60, null, 5, 80],
  },
};

describe("parseOpenMeteo", () => {
  it("maps a valid response into WeatherData", () => {
    const data = parseOpenMeteo(openMeteoSample, FETCHED_AT);

    expect(data.source).toBe("OPEN_METEO");
    expect(data.current).toEqual({
      tempC: 30.5,
      humidity: 74,
      windKmh: 11.2,
      text: "Partly cloudy",
    });
    expect(data.daily).toHaveLength(5);
    expect(data.daily[0]).toEqual({
      date: "2026-10-18",
      minC: 24,
      maxC: 33,
      rainMm: 0,
      rainChancePct: 10,
    });
    // A null chance means no value — shown as 0 rather than invented.
    expect(data.daily[2].rainChancePct).toBe(0);
  });

  it("rejects a response with mismatched daily arrays", () => {
    const broken = {
      ...openMeteoSample,
      daily: { ...openMeteoSample.daily, temperature_2m_max: [33] },
    };
    expect(() => parseOpenMeteo(broken, FETCHED_AT)).toThrow();
  });

  it("rejects a response with the wrong field types", () => {
    const broken = {
      current: { ...openMeteoSample.current, temperature_2m: "hot" },
      daily: openMeteoSample.daily,
    };
    expect(() => parseOpenMeteo(broken, FETCHED_AT)).toThrow();
  });

  it("maps WMO codes to text and says Unknown for anything else", () => {
    expect(wmoText(0)).toBe("Clear sky");
    expect(wmoText(95)).toBe("Thunderstorm");
    expect(wmoText(1234)).toBe("Unknown");
  });
});

function owmEntry(dt: number, temp: number, pop = 0.2, rain3h?: number) {
  return {
    dt,
    dt_txt: new Date(dt * 1000).toISOString().replace("T", " ").slice(0, 19),
    main: { temp, temp_min: temp - 1, temp_max: temp + 1, humidity: 70 },
    weather: [{ main: "Clouds", description: "scattered clouds" }],
    pop,
    wind: { speed: 3 },
    ...(rain3h !== undefined ? { rain: { "3h": rain3h } } : {}),
  };
}

describe("parseOwm", () => {
  it("folds the 3-hourly list into daily rows and converts wind m/s → km/h", () => {
    const d = (day: number, hour: number) =>
      Math.floor(Date.UTC(2026, 9, day, hour) / 1000);

    const list = [
      owmEntry(d(18, 9), 30),
      owmEntry(d(18, 12), 32, 0.5, 0.4),
      owmEntry(d(18, 15), 28),
      owmEntry(d(19, 9), 29),
      owmEntry(d(19, 12), 31),
      owmEntry(d(20, 9), 27),
    ];
    const data = parseOwm({ list }, FETCHED_AT);

    expect(data.source).toBe("OPENWEATHERMAP");
    expect(data.daily.map((day) => day.date)).toEqual([
      "2026-10-18",
      "2026-10-19",
      "2026-10-20",
    ]);
    expect(data.daily[0]).toMatchObject({ minC: 28, maxC: 32, rainMm: 0.4, rainChancePct: 50 });
    expect(data.current.tempC).toBe(30);
    expect(data.current.windKmh).toBe(10.8); // 3 m/s × 3.6
  });

  it("rejects an empty or malformed list", () => {
    expect(() => parseOwm({ list: [] }, FETCHED_AT)).toThrow();
    expect(() => parseOwm({ list: [{ dt: "nope" }] }, FETCHED_AT)).toThrow();
  });
});
