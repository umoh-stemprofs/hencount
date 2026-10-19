// loadWeather: fetch with cache and fallback.
//   1. A snapshot younger than WEATHER.cacheMinutes (30) is served as live
//      data with its age — no external call (00-global.md §3 "cache for
//      30 min"; the badge reads "Live · updated 12 min ago").
//   2. Otherwise fetch fresh: save a WeatherSnapshot, badge LIVE.
//   3. Provider fails → serve the last snapshot, badge "Saved data · X h old".
//   4. No snapshot at all → an error the page can show; the rest of the app
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

  const ageMinutesOf = (fetchedAt: string): number =>
    (now().getTime() - new Date(fetchedAt).getTime()) / 60_000;

  // 1. Cache: a recent snapshot is served without calling the provider.
  try {
    const cached = await store.latest(farm.id);
    const fresh = cached ? parseSnapshotPayload(cached) : null;
    if (fresh) {
      const age = ageMinutesOf(fresh.fetchedAt);
      if (age >= 0 && age < WEATHER.cacheMinutes) {
        return { status: "ok", data: fresh, badge: "LIVE", ageMinutes: age };
      }
    }
  } catch (error) {
    // A cache read failure must not stop a fresh fetch.
    console.warn("Could not read weather snapshot, fetching fresh:", error);
  }

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
      const ageMinutes = Math.max(0, ageMinutesOf(saved.fetchedAt));
      return { status: "saved", data: saved, badge: "CACHED", ageMinutes };
    }
    return {
      status: "error",
      message: "Weather is unavailable right now. Try again in a few minutes.",
    };
  }
}
