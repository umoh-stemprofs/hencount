// Provider-failure tests (00-global.md §3): a failed fetch must fall back to
// the last WeatherSnapshot ("Saved data · X h old"), and only show an error
// when there is no snapshot at all. Fetch and store are injected — no
// network, no database.
import { describe, expect, it, vi } from "vitest";
import { loadWeather } from "./load";
import type { SnapshotStore, SavedSnapshot } from "./store";
import type { WeatherProvider } from "./provider";
import type { WeatherData } from "./types";

const FARM = { id: "farm_demo", lat: 4.8156, lon: 7.0498 };

const SAMPLE: WeatherData = {
  current: { tempC: 30, humidity: 70, windKmh: 12, text: "Partly cloudy" },
  daily: [
    { date: "2026-10-18", minC: 24, maxC: 31, rainMm: 0, rainChancePct: 10 },
  ],
  fetchedAt: "2026-10-18T09:00:00.000Z",
  source: "OPEN_METEO",
};

const NOW = () => new Date("2026-10-18T12:00:00.000Z");

const okProvider: WeatherProvider = {
  source: "OPEN_METEO",
  fetchCurrent: vi.fn(async () => SAMPLE),
};

const failingProvider: WeatherProvider = {
  source: "OPEN_METEO",
  fetchCurrent: vi.fn(async () => {
    throw new Error("network down");
  }),
};

function fakeStore(snapshot: SavedSnapshot | null): SnapshotStore & {
  latest: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
} {
  return {
    latest: vi.fn(async () => snapshot),
    save: vi.fn(async () => undefined),
  };
}

const SAVED_SNAPSHOT: SavedSnapshot = {
  payload: { current: SAMPLE.current, daily: SAMPLE.daily },
  source: "OPEN_METEO",
  fetchedAt: new Date("2026-10-18T09:00:00.000Z"),
};

describe("loadWeather", () => {
  it("returns LIVE data and caches a snapshot when the provider answers", async () => {
    const store = fakeStore(null);
    const result = await loadWeather(FARM, { provider: okProvider, store, now: NOW });

    expect(result.status).toBe("ok");
    if (result.status === "error") throw new Error("unreachable");
    expect(result.badge).toBe("LIVE");
    // No age: it was fetched just now, not read from the cache.
    expect(result.ageMinutes).toBeUndefined();
    expect(store.save).toHaveBeenCalledTimes(1);
    // The cache was checked first (and was empty), then the fetch happened.
    expect(store.latest).toHaveBeenCalledTimes(1);
    expect(okProvider.fetchCurrent).toHaveBeenCalledTimes(1);
  });

  it("serves a snapshot younger than 30 minutes without calling the provider", async () => {
    // Fetched 15 minutes before `now` — inside the cache window.
    const store = fakeStore({
      ...SAVED_SNAPSHOT,
      fetchedAt: new Date("2026-10-18T11:45:00.000Z"),
    });
    const provider: WeatherProvider = {
      source: "OPEN_METEO",
      fetchCurrent: vi.fn(async () => SAMPLE),
    };
    const result = await loadWeather(FARM, { provider, store, now: NOW });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") throw new Error("unreachable");
    expect(result.badge).toBe("LIVE");
    expect(Math.round(result.ageMinutes ?? -1)).toBe(15);
    // Cache hit: no external call, no new snapshot row.
    expect(provider.fetchCurrent).not.toHaveBeenCalled();
    expect(store.save).not.toHaveBeenCalled();
  });

  it("refetches when the snapshot is older than 30 minutes", async () => {
    // SAVED_SNAPSHOT is 3 hours old — outside the cache window.
    const store = fakeStore(SAVED_SNAPSHOT);
    const provider: WeatherProvider = {
      source: "OPEN_METEO",
      fetchCurrent: vi.fn(async () => SAMPLE),
    };
    const result = await loadWeather(FARM, { provider, store, now: NOW });

    expect(result.status).toBe("ok");
    if (result.status !== "ok") throw new Error("unreachable");
    expect(result.ageMinutes).toBeUndefined();
    expect(provider.fetchCurrent).toHaveBeenCalledTimes(1);
    expect(store.save).toHaveBeenCalledTimes(1);
  });

  it("falls back to the saved snapshot with the Saved data badge when fetch fails", async () => {
    const store = fakeStore(SAVED_SNAPSHOT);
    const result = await loadWeather(FARM, { provider: failingProvider, store, now: NOW });

    expect(result.status).toBe("saved");
    if (result.status !== "saved") throw new Error("unreachable");
    expect(result.badge).toBe("CACHED");
    expect(result.data.current).toEqual(SAMPLE.current);
    // Snapshot was 3 hours old relative to `now`.
    expect(Math.round(result.ageMinutes)).toBe(180);
    expect(store.save).not.toHaveBeenCalled();
  });

  it("returns an error the page can show when fetch fails and nothing is saved", async () => {
    const store = fakeStore(null);
    const result = await loadWeather(FARM, { provider: failingProvider, store, now: NOW });

    expect(result.status).toBe("error");
    if (result.status !== "error") throw new Error("unreachable");
    expect(result.message).toMatch(/unavailable/i);
  });

  it("treats an unreadable saved payload as no snapshot", async () => {
    const store = fakeStore({ ...SAVED_SNAPSHOT, payload: { garbage: true } });
    const result = await loadWeather(FARM, { provider: failingProvider, store, now: NOW });

    expect(result.status).toBe("error");
  });
});
