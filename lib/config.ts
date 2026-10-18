// App config. Alert thresholds are SAMPLES (00-global.md §2): a poultry
// expert must confirm them before real use.

export const WEATHER = {
  /** Cache a weather response in WeatherSnapshot for this long. */
  cacheMinutes: 30,
  /** Hard timeout for one external weather call. */
  timeoutMs: 5_000,
  /** One retry after a failed call (00-global.md §3). */
  retries: 1,
  /** Open-Meteo / OWM days to fold into the daily list. */
  forecastDays: 5,
} as const;

export const EGGS = {
  /** Eggs in one tray (the market unit for EGGS_TRAY). */
  perTray: 30,
  /** Advice needs at least this many day logs (docs/03-hencount.md). */
  adviceMinLogs: 3,
  /** Average laying rate below this % counts as "few eggs" (sample). */
  layingRateMinPct: 60,
  /** Average feed per hen above this g/day counts as "too much feed" (sample). */
  feedPerHenMaxG: 140,
} as const;

export const ALERTS = {
  /** forecast maxC ≥ 34 → heat alert (docs/03-hencount.md). */
  heatMaxC: 34,
  /** rainMm ≥ 20 in the next 3 days → heavy rain (kept for later steps). */
  heavyRainMm: 20,
  /** humidity ≥ 80 → damp (kept for later steps). */
  dampHumidityPct: 80,
} as const;

/** Default farm location: Port Harcourt (00-global.md §3). */
export const DEFAULT_FARM = {
  id: "farm_demo",
  name: "Port Harcourt farm",
  lat: 4.8156,
  lon: 7.0498,
} as const;

export function isValidLat(lat: number): boolean {
  return Number.isFinite(lat) && lat >= -90 && lat <= 90;
}

export function isValidLon(lon: number): boolean {
  return Number.isFinite(lon) && lon >= -180 && lon <= 180;
}
