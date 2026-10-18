// Open-Meteo (default provider — no API key needed).
// Docs: https://open-meteo.com/en/docs
// current = temperature_2m, relative_humidity_2m, wind_speed_10m (km/h), weather_code
// daily   = temperature_2m_max/min (°C), precipitation_sum (mm), precipitation_probability_max (%)
import { APP_TZ } from "../dates";
import { WEATHER } from "../config";
import { fetchJsonWithRetry } from "./http";
import { openMeteoResponseSchema } from "./schemas";
import type { WeatherData, WeatherDay } from "./types";

/** WMO weather code → short text (https://open-meteo.com/en/docs). */
const WMO_TEXT: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Dense drizzle",
  56: "Freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Heavy rain showers",
  82: "Violent rain showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with heavy hail",
};

export function wmoText(code: number): string {
  return WMO_TEXT[code] ?? "Unknown";
}

export function buildOpenMeteoUrl(lat: number, lon: number): string {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
    daily:
      "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max",
    forecast_days: String(WEATHER.forecastDays),
    timezone: APP_TZ,
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

/** Validate the response and fold it into WeatherData. Rejects anything odd. */
export function parseOpenMeteo(raw: unknown, fetchedAt: Date): WeatherData {
  const parsed = openMeteoResponseSchema.parse(raw);
  const { daily } = parsed;
  if (
    daily.temperature_2m_max.length !== daily.time.length ||
    daily.temperature_2m_min.length !== daily.time.length ||
    daily.precipitation_sum.length !== daily.time.length ||
    daily.precipitation_probability_max.length !== daily.time.length
  ) {
    throw new Error("Open-Meteo daily arrays do not match the time array.");
  }

  const days: WeatherDay[] = daily.time.slice(0, WEATHER.forecastDays).map((date, i) => ({
    date,
    // A null in a daily array means "no value" — rain sums/chances treat
    // that as no rain rather than inventing a number.
    minC: daily.temperature_2m_min[i] ?? 0,
    maxC: daily.temperature_2m_max[i] ?? 0,
    rainMm: daily.precipitation_sum[i] ?? 0,
    rainChancePct: daily.precipitation_probability_max[i] ?? 0,
  }));

  return {
    current: {
      tempC: parsed.current.temperature_2m,
      humidity: parsed.current.relative_humidity_2m,
      windKmh: parsed.current.wind_speed_10m,
      text: wmoText(parsed.current.weather_code),
    },
    daily: days,
    fetchedAt: fetchedAt.toISOString(),
    source: "OPEN_METEO",
  };
}

export async function fetchOpenMeteo(
  lat: number,
  lon: number,
  fetchOptions?: Parameters<typeof fetchJsonWithRetry>[1],
): Promise<WeatherData> {
  const raw = await fetchJsonWithRetry(buildOpenMeteoUrl(lat, lon), fetchOptions);
  return parseOpenMeteo(raw, new Date());
}
