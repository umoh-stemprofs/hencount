// Weather adapter types (00-global.md §3): every provider returns the same
// shape, so the UI never knows which service answered.

export interface WeatherNow {
  tempC: number;
  humidity: number;
  windKmh: number;
  text: string;
}

export interface WeatherDay {
  /** "YYYY-MM-DD" in APP_TZ. */
  date: string;
  minC: number;
  maxC: number;
  rainMm: number;
  rainChancePct: number;
}

export interface WeatherData {
  current: WeatherNow;
  /** 5 days, today first. */
  daily: WeatherDay[];
  /** ISO timestamp of when the provider answered. */
  fetchedAt: string;
  source: "OPEN_METEO" | "OPENWEATHERMAP";
}

export type WeatherLoadResult =
  | { status: "ok"; data: WeatherData; badge: "LIVE" }
  | { status: "saved"; data: WeatherData; badge: "CACHED"; ageMinutes: number }
  | { status: "error"; message: string };
