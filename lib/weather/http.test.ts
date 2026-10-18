// External-call tests: 5 s timeout wrapper with one retry (00-global.md §3).
// fetchFn is injected, so these never touch the network.
import { describe, expect, it, vi } from "vitest";
import { fetchJsonWithRetry, WeatherFetchError } from "./http";

const URL_UNDER_TEST = "https://weather.test/forecast";

describe("fetchJsonWithRetry", () => {
  it("retries once after a failed fetch and then succeeds", async () => {
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ temp: 30 }) } as Response);

    const result = await fetchJsonWithRetry(URL_UNDER_TEST, {
      fetchFn: fetchFn as unknown as typeof fetch,
    });

    expect(result).toEqual({ temp: 30 });
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("gives up after the retry and throws WeatherFetchError", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("network down"));

    await expect(
      fetchJsonWithRetry(URL_UNDER_TEST, { fetchFn: fetchFn as unknown as typeof fetch }),
    ).rejects.toBeInstanceOf(WeatherFetchError);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("treats a non-2xx response as a failure worth retrying", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503 } as Response)
      .mockResolvedValueOnce({ ok: false, status: 503 } as Response);

    await expect(
      fetchJsonWithRetry(URL_UNDER_TEST, { fetchFn: fetchFn as unknown as typeof fetch }),
    ).rejects.toThrow(/HTTP 503/);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});
