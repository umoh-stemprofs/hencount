// loadWeather: fetch with cache and fallback.
//   1. Fresh provider answer → save a WeatherSnapshot, badge LIVE.
//   2. Provider fails → serve the last snapshot, badge "Saved data · X h old".
//   3. No snapshot at all → an error the page can show; the rest of the app
//      keeps working.
import "server-only";
import { WEATHER } from "../config";
import { getWeatherProvider, type WeatherProvider } from "./provider";
import {
  parseSnapshotPayload,
  prismaSnapshotStore,
  type SnapshotStore,
} from "./store";
import type { WeatherLoadResult } from "./types";

export interface FarmLocation {
  id: string;
  lat: number;
  lon: number;
}

export interface LoadWeatherDeps {
  provider?: WeatherProvider;
  store?: SnapshotStore;
  now?: () => Date;
}

export async function loadWeather(
  farm: FarmLocation,
  deps: LoadWeatherDeps = {},
): Promise<WeatherLoadResult> {
  const provider = deps.provider ?? getWeatherProvider();
  const store = deps.store ?? prismaSnapshotStore;
  const now = deps.now ?? (() => new Date());

  try {
    const data = await provider.fetchCurrent(farm.lat, farm.lon);
    try {
      await store.save(farm.id, data);
    } catch (error) {
      // Caching is best-effort: a cache write failure must not break the page.
      console.warn("Could not cache weather snapshot:", error);
    }
    return { status: "ok", data, badge: "LIVE" };
  } catch (error) {
    console.warn("Weather provider failed, trying saved snapshot:", error);
    let snapshot = null;
    try {
      snapshot = await store.latest(farm.id);
    } catch (dbError) {
      console.warn("Could not read weather snapshot:", dbError);
    }
    const saved = snapshot ? parseSnapshotPayload(snapshot) : null;
    if (saved) {
      const ageMinutes = Math.max(
        0,
        (now().getTime() - new Date(saved.fetchedAt).getTime()) / 60_000,
      );
      return { status: "saved", data: saved, badge: "CACHED", ageMinutes };
    }
    return {
      status: "error",
      message: "Weather is unavailable right now. Try again in a few minutes.",
    };
  }
}
