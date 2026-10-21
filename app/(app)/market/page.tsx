// Market / "Prices" (docs/03-hencount.md page 7), built to the mockup
// structure in stitch_.../hencount_prices_today_desktop: the data-source badge
// sits inline beside the heading, three crop price cards sit in a row, and
// the chart and its table live in their own accordions.
//
// The Agriculture rule needs prices for at least 3 crops — the tray price
// plus the three crops below ride the same feed. Nothing here invents a
// number: a missing price shows "—", and the feed's source is always badged.
import { Crop, Unit } from "@prisma/client";
import { Egg, Leaf, Sprout, TrendingDown, TrendingUp, Wheat } from "lucide-react";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { EggPriceCard } from "@/components/EggPriceCard";
import { PriceChartCard } from "@/components/charts/PriceChartCard";
import { card, StatLabel, StatNote, StatValue } from "@/components/ui";
import { formatDayShort, formatNaira } from "@/lib/dates";
import { getCrop } from "@/lib/market/catalog";
import { getMarketProvider } from "@/lib/market/provider";
import type { MarketTick } from "@/lib/market/generator";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

/** The rule needs prices for at least 3 crops; these ride the same feed. */
const OTHER_CROPS = [Crop.MAIZE, Crop.TOMATO, Crop.CASSAVA];

const UNIT_WORD: Record<Unit, string> = {
  [Unit.KG]: "per kg",
  [Unit.TRAY]: "per tray",
  [Unit.LITRE]: "per litre",
};

const CROP_ICON: Record<string, React.ReactNode> = {
  [Crop.MAIZE]: <Wheat className="h-6 w-6" aria-hidden="true" />,
  [Crop.TOMATO]: <Leaf className="h-6 w-6" aria-hidden="true" />,
  [Crop.CASSAVA]: <Sprout className="h-6 w-6" aria-hidden="true" />,
  [Crop.EGGS_TRAY]: <Egg className="h-6 w-6" aria-hidden="true" />,
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
    ...OTHER_CROPS.map((crop) => provider.getHistory(crop, 2).catch(() => null)),
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
      const prior = index > 0 ? all[index - 1] : null;
      const changePct =
        prior && prior.priceKobo > 0
          ? ((tick.priceKobo - prior.priceKobo) / prior.priceKobo) * 100
          : null;
      return { ...tick, changePct };
    })
    .slice(-7);

  return (
    <div className="flex flex-col gap-space-xl">
      <header className="flex flex-col gap-space-xs">
        <div className="flex flex-wrap items-center gap-space-sm">
          <h1 className="text-headline-lg tracking-tight text-text">
            Prices today
          </h1>
          <DataSourceBadge kind="simulated" />
        </div>
        <p className="max-w-[70ch] text-body-lg leading-7 text-muted">
          What a tray of 30 eggs is fetching. The price feeds the stock value
          and the profit numbers.
        </p>
      </header>

      {/* Egg tray card + the 7-day table side by side */}
      <div className="grid gap-space-lg lg:grid-cols-3">
        <EggPriceCard data={eggPrice} />

        <section className={`lg:col-span-2 ${card}`} aria-labelledby="price-table">
          <div className="flex flex-wrap items-start justify-between gap-space-sm">
            <h2 id="price-table" className="text-headline-sm text-text">
              Egg tray price, last 7 days
            </h2>
            <DataSourceBadge kind="simulated" />
          </div>

          {rows.length === 0 ? (
            <p className="mt-3 text-body-lg leading-7 text-danger">
              Prices are unavailable right now. Try again in a few minutes.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-left text-body-base">
                <caption className="sr-only">
                  Egg tray price for each of the last 7 days, in naira, with the
                  change from the previous day.
                </caption>
                <thead>
                  <tr className="bg-[#F1F3FF] text-text">
                    <th scope="col" className="p-space-md font-semibold">
                      Day
                    </th>
                    <th scope="col" className="p-space-md text-right font-semibold">
                      Price per tray
                    </th>
                    <th scope="col" className="p-space-md text-right font-semibold">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((row) => (
                    <tr key={row.date} className="hover:bg-[#F1F3FF]/50">
                      <th
                        scope="row"
                        className="p-space-md text-left font-normal text-text"
                      >
                        {formatDayShort(new Date(`${row.date}T12:00:00Z`))}
                      </th>
                      <td className="p-space-md text-right tabular-nums text-text">
                        {formatNaira(row.priceKobo)}
                      </td>
                      <td className="p-space-md text-right tabular-nums">
                        {row.changePct === null ? (
                          <span className="text-muted">—</span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 font-semibold ${
                              row.changePct >= 0 ? "text-success" : "text-danger"
                            }`}
                          >
                            {row.changePct >= 0 ? (
                              <TrendingUp className="h-5 w-5" aria-hidden="true" />
                            ) : (
                              <TrendingDown className="h-5 w-5" aria-hidden="true" />
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

          <p className="mt-3 text-body-base leading-6 text-muted">
            The feed is simulated: the same date always gives the same price. A
            real feed can replace it without changing this page.
          </p>
        </section>
      </div>

      {/* Three crop price cards, exactly as the mockup lays them out */}
      <section aria-labelledby="other-crops">
        <div className="mb-space-md flex flex-wrap items-center justify-between gap-space-sm">
          <h2 id="other-crops" className="text-headline-md text-text">
            Other crops, same market feed
          </h2>
          <DataSourceBadge kind="simulated" />
        </div>
        <div className="grid grid-cols-1 gap-space-lg md:grid-cols-3">
          {otherCrops.map(({ crop, meta, latest: tick, changePct }) => (
            <section key={crop} className={card} aria-label={meta.label}>
              <StatLabel trailing={<span className="text-muted">{CROP_ICON[crop]}</span>}>
                {meta.label}
              </StatLabel>
              <StatValue>{tick ? formatNaira(tick.priceKobo) : "—"}</StatValue>
              <StatNote>{UNIT_WORD[meta.unit]}</StatNote>
              {changePct === null ? (
                <p className="mt-1 text-body-base text-muted">
                  No change to show yet.
                </p>
              ) : (
                <p
                  className={`mt-1 inline-flex items-center gap-1 text-label-base font-semibold ${
                    changePct >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {changePct >= 0 ? (
                    <TrendingUp className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <TrendingDown className="h-5 w-5" aria-hidden="true" />
                  )}
                  {changePct >= 0 ? "Up" : "Down"}{" "}
                  {Math.abs(changePct).toFixed(1)}% vs yesterday
                </p>
              )}
            </section>
          ))}
        </div>
        <p className="mt-3 text-body-base leading-6 text-muted">
          Sample base prices. A poultry or produce expert must confirm them
          before real use.
        </p>
      </section>

      <PriceChartCard
        id="market-price-chart"
        title="Price chart"
        badge={<DataSourceBadge kind="simulated" />}
        series={series}
        emptySentence="Prices are unavailable right now."
        emptyAction={{ href: "/market", label: "Try again" }}
      />
    </div>
  );
}
