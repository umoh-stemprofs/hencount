// Egg-tray price card (kept from step 2, with its Simulated badge).
// The price comes from the market provider (deterministic generator,
// persisted into PriceTick).
import { Crop } from "@prisma/client";
import { TrendingDown, TrendingUp } from "lucide-react";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { card, StatLabel, StatNote, StatValue } from "@/components/ui";
import { formatDayShort, formatNaira } from "@/lib/dates";
import { getCrop } from "@/lib/market/catalog";
import { getMarketProvider } from "@/lib/market/provider";

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
    if (!latest) {
      return { priceKobo: null, priceDate: null, changePct: null, failed: false };
    }
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
      <StatLabel trailing={<DataSourceBadge kind="simulated" />}>
        <span id="egg-price-title">Egg tray price</span>
      </StatLabel>

      {data.failed || data.priceKobo === null ? (
        <p className="mt-3 text-body-lg leading-7 text-danger">
          Prices are unavailable right now. Try again in a few minutes.
        </p>
      ) : (
        <>
          <StatValue>{formatNaira(data.priceKobo)}</StatValue>
          <StatNote>per tray of 30 eggs</StatNote>
          {data.changePct !== null && (
            <p
              className={`mt-2 inline-flex items-center gap-1.5 text-body-base font-semibold ${
                data.changePct >= 0 ? "text-success" : "text-danger"
              }`}
            >
              {data.changePct >= 0 ? (
                <TrendingUp className="h-5 w-5" aria-hidden="true" />
              ) : (
                <TrendingDown className="h-5 w-5" aria-hidden="true" />
              )}
              {data.changePct >= 0 ? "Up" : "Down"}{" "}
              {Math.abs(data.changePct).toFixed(1)}% vs yesterday
            </p>
          )}
          <p className="mt-3 text-body-base leading-6 text-muted">
            As of{" "}
            {formatDayShort(new Date(`${data.priceDate}T12:00:00Z`))} ·{" "}
            {meta.label}
          </p>
        </>
      )}
    </section>
  );
}
