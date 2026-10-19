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
  | {
      status: "ok";
      data: WeatherData;
      badge: "LIVE";
      /**
       * Age of the reading in minutes. Set when it came from the 30-minute
       * snapshot cache; undefined means it was fetched just now (the badge
       * then reads "Live · updated just now", design.md §2).
       */
      ageMinutes?: number;
    }
  | { status: "saved"; data: WeatherData; badge: "CACHED"; ageMinutes: number }
  | { status: "error"; message: string };
