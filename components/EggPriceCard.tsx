// Egg-tray price card (kept from step 2, with its Simulated badge).
// The price comes from the market provider (deterministic generator,
// persisted into PriceTick).
import { Crop } from "@prisma/client";
import { TrendingDown, TrendingUp } from "lucide-react";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { formatDayShort, formatNaira } from "@/lib/dates";
import { getCrop } from "@/lib/market/catalog";
import { getMarketProvider } from "@/lib/market/provider";

const card = "rounded-card border border-border bg-surface p-6 shadow-card";

export interface EggPriceCardData {
  priceKobo: number | null;
  /** "YYYY-MM-DD" of the latest tick. */
  priceDate: string | null;
  changePct: number | null;
  failed: boolean;
}

/** Fetches the latest two ticks; safe to call from a server component. */
export async function loadEggPrice(): Promise<EggPriceCardData> {
  try {
    const ticks = await getMarketProvider().getHistory(Crop.EGGS_TRAY, 2);
    const latest = ticks[ticks.length - 1];
    if (!latest) return { priceKobo: null, priceDate: null, changePct: null, failed: false };
    const prev = ticks.length === 2 ? ticks[0] : null;
    const changePct =
      prev && prev.priceKobo > 0
        ? ((latest.priceKobo - prev.priceKobo) / prev.priceKobo) * 100
        : null;
    return {
      priceKobo: latest.priceKobo,
      priceDate: latest.date,
      changePct,
      failed: false,
    };
  } catch {
    return { priceKobo: null, priceDate: null, changePct: null, failed: true };
  }
}

export function EggPriceCard({ data }: { data: EggPriceCardData }) {
  const meta = getCrop(Crop.EGGS_TRAY)!;
  return (
    <section className={card} aria-labelledby="egg-price-title">
      <div className="flex items-start justify-between gap-3">
        <h2 id="egg-price-title" className="text-sm font-medium text-muted">
          Egg tray price
        </h2>
        <DataSourceBadge kind="simulated" />
      </div>
      {data.failed || data.priceKobo === null ? (
        <p className="mt-3 text-base leading-6 text-danger">
          Prices are unavailable right now. Try again in a few minutes.
        </p>
      ) : (
        <>
          <p className="mt-2 text-4xl font-bold tabular-nums text-text">
            {formatNaira(data.priceKobo)}
          </p>
          <p className="mt-1 text-sm text-muted">per tray of 30 eggs</p>
          {data.changePct !== null && (
            <p
              className={`mt-3 inline-flex items-center gap-1.5 text-sm font-medium ${
                data.changePct >= 0 ? "text-success" : "text-danger"
              }`}
            >
              {data.changePct >= 0 ? (
                <TrendingUp className="h-4 w-4" aria-hidden="true" />
              ) : (
                <TrendingDown className="h-4 w-4" aria-hidden="true" />
              )}
              {data.changePct >= 0 ? "Up" : "Down"}{" "}
              {Math.abs(data.changePct).toFixed(1)}% vs yesterday
            </p>
          )}
          <p className="mt-3 text-sm text-muted">
            As of{" "}
            {formatDayShort(new Date(`${data.priceDate}T12:00:00Z`))} ·{" "}
            {meta.label}
          </p>
        </>
      )}
    </section>
  );
}
