// One external-call helper for weather: hard 5 s timeout, one retry
// (00-global.md §3). fetchFn is injectable so tests never touch the network.
import { WEATHER } from "../config";

export class WeatherFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WeatherFetchError";
  }
}

export interface FetchJsonOptions {
  timeoutMs?: number;
  retries?: number;
  fetchFn?: typeof fetch;
}

export async function fetchJsonWithRetry(
  url: string,
  options: FetchJsonOptions = {},
): Promise<unknown> {
  const {
    timeoutMs = WEATHER.timeoutMs,
    retries = WEATHER.retries,
    fetchFn = fetch,
  } = options;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchFn(url, {
        signal: AbortSignal.timeout(timeoutMs),
        headers: { accept: "application/json" },
      });
      if (!res.ok) {
        throw new WeatherFetchError(`Weather service returned HTTP ${res.status}.`);
      }
      return await res.json();
    } catch (error) {
      lastError = error;
    }
  }
  const detail = lastError instanceof Error ? lastError.message : String(lastError);
  throw new WeatherFetchError(`Weather request failed after ${retries + 1} attempt(s): ${detail}`);
}
