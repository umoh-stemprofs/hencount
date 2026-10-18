// OpenWeatherMap 5-day / 3-hour forecast — only used when OWM_API_KEY is set.
// Docs: https://openweathermap.org/api/forecast5
// units=metric → °C; wind speed is in m/s (we convert to km/h). The 3-hourly
// list is folded into 5 calendar days in APP_TZ.
import { APP_TZ, todayInAppTz } from "../dates";
import { WEATHER } from "../config";
import { fetchJsonWithRetry } from "./http";
import { owmResponseSchema } from "./schemas";
import type { WeatherData, WeatherDay } from "./types";

export function buildOwmUrl(lat: number, lon: number, apiKey: string): string {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    appid: apiKey,
    units: "metric",
  });
  return `https://api.openweathermap.org/data/2.5/forecast?${params.toString()}`;
}

function appTzDayKey(dtSeconds: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(dtSeconds * 1000));
}

/** Validate and fold the 3-hourly list into daily rows (today first, 5 days). */
export function parseOwm(raw: unknown, fetchedAt: Date): WeatherData {
  const { list } = owmResponseSchema.parse(raw);
  const todayKey = todayInAppTz(fetchedAt).toISOString().slice(0, 10);

  const byDay = new Map<string, { temps: number[]; rainMm: number; chancePct: number }>();
  for (const entry of list) {
    const key = appTzDayKey(entry.dt);
    const bucket = byDay.get(key) ?? { temps: [], rainMm: 0, chancePct: 0 };
    bucket.temps.push(entry.main.temp);
    bucket.rainMm += (entry.rain?.["3h"] ?? 0) + (entry.snow?.["3h"] ?? 0);
    bucket.chancePct = Math.max(bucket.chancePct, (entry.pop ?? 0) * 100);
    byDay.set(key, bucket);
  }

  const days: WeatherDay[] = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .filter(([date]) => date >= todayKey)
    .slice(0, WEATHER.forecastDays)
    .map(([date, b]) => ({
      date,
      minC: Math.min(...b.temps),
      maxC: Math.max(...b.temps),
      rainMm: Math.round(b.rainMm * 10) / 10,
      rainChancePct: Math.round(b.chancePct),
    }));

  const first = list[0];
  return {
    current: {
      tempC: first.main.temp,
      humidity: first.main.humidity,
      // metric wind speed is m/s; the app's shape is km/h.
      windKmh: Math.round((first.wind?.speed ?? 0) * 3.6 * 10) / 10,
      text: first.weather[0].description,
    },
    daily: days,
    fetchedAt: fetchedAt.toISOString(),
    source: "OPENWEATHERMAP",
  };
}

export async function fetchOwm(
  lat: number,
  lon: number,
  apiKey: string,
  fetchOptions?: Parameters<typeof fetchJsonWithRetry>[1],
): Promise<WeatherData> {
  const raw = await fetchJsonWithRetry(buildOwmUrl(lat, lon, apiKey), fetchOptions);
  return parseOwm(raw, new Date());
}
