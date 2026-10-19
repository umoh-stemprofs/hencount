// Market (docs/03-hencount.md page 7): the egg tray price with its
// data-source badge, the change since yesterday, a 7-day table, the
// 7/30/90-day line chart (step 5), and price cards for three more crops
// from the same feed (step 6 rules checklist: "prices for at least 3 crops").
import { Crop, Unit } from "@prisma/client";
import { TrendingDown, TrendingUp } from "lucide-react";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { EggPriceCard } from "@/components/EggPriceCard";
import { PriceChartCard } from "@/components/charts/PriceChartCard";
import { formatDayShort, formatNaira } from "@/lib/dates";
import { getCrop } from "@/lib/market/catalog";
import { getMarketProvider } from "@/lib/market/provider";
import type { MarketTick } from "@/lib/market/generator";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const card = "rounded-card border border-border bg-surface p-6 shadow-card";

/** The rule needs prices for at least 3 crops; these ride the same feed. */
const OTHER_CROPS = [Crop.MAIZE, Crop.TOMATO, Crop.CASSAVA];

const UNIT_WORD: Record<Unit, string> = {
  [Unit.KG]: "per kg",
  [Unit.TRAY]: "per tray",
  [Unit.LITRE]: "per litre",
};

export default async function MarketPage() {
  await requireUser();

  // Speed (step 6): the 90-day egg history and the three extra crops run
  // together; each returns two ticks (today + yesterday) for the change %.
  const provider = getMarketProvider();
  const [history, ...otherTicks] = await Promise.all([
    provider.getHistory(Crop.EGGS_TRAY, 90).catch((error) => {
      console.warn("Market history unavailable:", error);
      return null;
    }),
    ...OTHER_CROPS.map((crop) =>
      provider.getHistory(crop, 2).catch(() => null),
    ),
  ]);

  const otherCrops = OTHER_CROPS.map((crop, index) => {
    const ticks = otherTicks[index] ?? [];
    const meta = getCrop(crop)!;
    const latest = ticks.length > 0 ? ticks[ticks.length - 1] : null;
    const previous = ticks.length > 1 ? ticks[0] : null;
    const changePct =
      latest && previous && previous.priceKobo > 0
        ? ((latest.priceKobo - previous.priceKobo) / previous.priceKobo) * 100
        : null;
    return { crop, meta, latest, changePct };
  });

  const series = (history ?? []).map((tick) => ({
    date: tick.date,
    priceKobo: tick.priceKobo,
  }));
  const latest = series.length > 0 ? series[series.length - 1] : null;
  const previous = series.length > 1 ? series[series.length - 2] : null;
  const eggPrice = {
    priceKobo: latest?.priceKobo ?? null,
    priceDate: latest?.date ?? null,
    changePct:
      latest && previous && previous.priceKobo > 0
        ? ((latest.priceKobo - previous.priceKobo) / previous.priceKobo) * 100
        : null,
    failed: history === null,
  };

  const rows = (history ?? [])
    .map((tick, index, all) => {
      const previous = index > 0 ? all[index - 1] : null;
      const changePct =
        previous && previous.priceKobo > 0
          ? ((tick.priceKobo - previous.priceKobo) / previous.priceKobo) * 100
          : null;
      return { ...tick, changePct };
    })
    .slice(-7);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-text">Market</h1>
        <p className="mt-1 max-w-[70ch] leading-6 text-muted">
          What a tray of 30 eggs is fetching. The price feeds the stock value
          and the profit numbers.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <EggPriceCard data={eggPrice} />

        <section className={`lg:col-span-2 ${card}`} aria-labelledby="price-table">
          <div className="flex items-start justify-between gap-3">
            <h2 id="price-table" className="text-lg font-semibold text-text">
              Egg tray price, last 7 days
            </h2>
            <DataSourceBadge kind="simulated" />
          </div>

          {rows.length === 0 ? (
            <p className="mt-3 text-base leading-6 text-danger">
              Prices are unavailable right now. Try again in a few minutes.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-left text-base">
                <caption className="sr-only">
                  Egg tray price for each of the last 7 days, in naira, with the
                  change from the previous day.
                </caption>
                <thead>
                  <tr className="border-b border-border text-sm text-muted">
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Day
                    </th>
                    <th scope="col" className="py-2 pr-4 text-right font-medium">
                      Price per tray
                    </th>
                    <th scope="col" className="py-2 text-right font-medium">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.date} className="border-b border-border last:border-0">
                      <th
                        scope="row"
                        className="py-3 pr-4 text-left font-normal text-text"
                      >
                        {formatDayShort(new Date(`${row.date}T12:00:00Z`))}
                      </th>
                      <td className="py-3 pr-4 text-right tabular-nums text-text">
                        {formatNaira(row.priceKobo)}
                      </td>
                      <td className="py-3 text-right tabular-nums">
                        {row.changePct === null ? (
                          <span className="text-muted">—</span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 font-medium ${
                              row.changePct >= 0 ? "text-success" : "text-danger"
                            }`}
                          >
                            {row.changePct >= 0 ? (
                              <TrendingUp className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <TrendingDown className="h-4 w-4" aria-hidden="true" />
                            )}
                            {Math.abs(row.changePct).toFixed(1)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-3 text-sm leading-6 text-muted">
            The feed is simulated: the same date always gives the same price. A
            real feed can replace it without changing this page.
          </p>
        </section>
      </div>

      {/* The Agriculture rules need prices for at least 3 crops — these
          three ride the same feed as the tray price. */}
      <section className={card} aria-labelledby="other-crops">
        <div className="flex items-start justify-between gap-3">
          <h2 id="other-crops" className="text-lg font-semibold text-text">
            Other crops, same market feed
          </h2>
          <DataSourceBadge kind="simulated" />
        </div>
        <ul className="mt-4 grid gap-4 sm:grid-cols-3">
          {otherCrops.map(({ crop, meta, latest, changePct }) => (
            <li
              key={crop}
              className="rounded-input border border-border bg-surface p-4"
            >
              <p className="text-sm font-medium text-muted">{meta.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-text">
                {latest ? formatNaira(latest.priceKobo) : "—"}
              </p>
              <p className="text-sm text-muted">{UNIT_WORD[meta.unit]}</p>
              {changePct === null ? (
                <p className="mt-2 text-sm text-muted">
                  No change to show yet.
                </p>
              ) : (
                <p
                  className={`mt-2 inline-flex items-center gap-1 text-sm font-medium ${
                    changePct >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {changePct >= 0 ? (
                    <TrendingUp className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <TrendingDown className="h-4 w-4" aria-hidden="true" />
                  )}
                  {changePct >= 0 ? "Up" : "Down"}{" "}
                  {Math.abs(changePct).toFixed(1)}% vs yesterday
                </p>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm leading-6 text-muted">
          Sample base prices. A poultry or produce expert must confirm them
          before real use.
        </p>
      </section>

      <PriceChartCard
        id="market-price-chart"
        title="Egg tray price history"
        badge={<DataSourceBadge kind="simulated" />}
        series={series}
        emptySentence="Prices are unavailable right now."
        emptyAction={{ href: "/market", label: "Try again" }}
      />
    </div>
  );
}
