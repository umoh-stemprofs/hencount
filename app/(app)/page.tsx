// Dashboard (docs/03-hencount.md §2) built to the mockup structure in
// stitch_.../hencount_home_desktop: a 12-column grid with a 7-column content
// column (production card → two money cards → heat banner → weather/price
// rows) and a 5-column chart column whose charts are accordions.
//
// Nothing here computes new numbers. Every value comes from the same
// /lib/dashboard.ts, /lib/eggs.ts and /lib/charts.ts maths as before, with
// the same Live / Saved data / Simulated badges on the same data.
import { Banknote, Egg, Plus } from "lucide-react";
import Link from "next/link";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { EggBarsCard } from "@/components/charts/EggBarsCard";
import { StockPieCard } from "@/components/charts/StockPieCard";
import { HeatBanner } from "@/components/HeatBanner";
import { EggPriceCard, loadEggPrice } from "@/components/EggPriceCard";
import { WeatherCard } from "@/components/WeatherCard";
import { btnPrimary, card } from "@/components/ui";
import { heatAlert } from "@/lib/alerts";
import { DEFAULT_FARM } from "@/lib/config";
import { computeDashboard, type DashboardStats } from "@/lib/dashboard";
import {
  eggsSeriesAllFlocks,
  stockValueSlices,
  type StockSlice,
} from "@/lib/charts";
import { dateKey, formatNaira, todayInAppTz } from "@/lib/dates";
import { getFarmForUser, getFlocksForFarm } from "@/lib/data";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { loadWeather } from "@/lib/weather/load";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // The session's own user; every read below is scoped to their farm.
  // Speed (step 6): independent calls run in parallel — wave 1 below,
  // wave 2 once the farm id is known.
  const user = await requireUser();
  const today = todayInAppTz();
  const todayKey = dateKey(today);
  const demoMode = process.env.DEMO_MODE === "true";

  const [farm, eggPrice] = await Promise.all([
    getFarmForUser(user.userId),
    loadEggPrice(),
  ]);
  const trayPriceKobo = eggPrice.priceKobo;

  const [flocks, feedPrice, weather] = await Promise.all([
    farm ? getFlocksForFarm(farm.id, user.userId) : Promise.resolve([]),
    farm
      ? db.feedPrice.findUnique({ where: { farmId: farm.id } })
      : Promise.resolve(null),
    loadWeather(farm ?? DEFAULT_FARM),
  ]);
  const feedPriceKobo = feedPrice?.priceKobo ?? null;

  const stats: DashboardStats | null = farm
    ? computeDashboard({
        flocks: flocks.map((f) => ({
          logs: f.logs.map((l) => ({
            date: dateKey(l.date),
            eggs: l.eggs,
            feedKg: l.feedKg,
          })),
          sales: f.sales.map((s) => ({ eggs: s.eggs })),
        })),
        todayKey,
        trayPriceKobo,
        feedPriceKobo,
      })
    : null;

  // Chart inputs: raw logs only — /lib/charts.ts keeps the gaps.
  const eggPoints = eggsSeriesAllFlocks(
    flocks.map((flock) => ({
      logs: flock.logs.map((log) => ({
        date: dateKey(log.date),
        hens: log.hens,
        eggs: log.eggs,
        feedKg: log.feedKg,
      })),
    })),
    today,
    7,
  );
  const stockSlices: StockSlice[] =
    trayPriceKobo === null
      ? []
      : stockValueSlices(
          flocks.map((flock) => ({
            name: flock.name,
            laidEggs: flock.logs.reduce((sum, log) => sum + log.eggs, 0),
            soldEggs: flock.sales.reduce((sum, sale) => sum + sale.eggs, 0),
          })),
          trayPriceKobo,
        );

  // The mockup's "Active Flock" line: real hens and a real laying rate,
  // taken from today's logs only. Never a figure we had to invent.
  const todayLogs = flocks.flatMap((flock) =>
    flock.logs.filter((log) => dateKey(log.date) === todayKey),
  );
  const hensToday = todayLogs.reduce((sum, log) => sum + log.hens, 0);
  const activeFlock = flocks.find((flock) =>
    flock.logs.some((log) => dateKey(log.date) === todayKey),
  );
  const layingRatePct =
    hensToday > 0 && stats?.hasTodayLog
      ? Math.round((stats.todayEggs / hensToday) * 100)
      : null;

  const addTodayAction = {
    href: flocks[0] ? `/eggs/${flocks[0].id}/add` : "/eggs",
    label: "Add today",
  };

  const weatherFarm = farm ?? DEFAULT_FARM;
  const heat = weather.status !== "error" ? heatAlert(weather.data.daily) : null;

  const eggTotal = eggPoints.reduce(
    (sum, point) => sum + (point.eggs ?? 0),
    0,
  );
  const eggDays = eggPoints.filter((point) => point.eggs !== null).length;

  return (
    <div className="flex flex-col gap-space-lg">
      {/* Greeting */}
      <div className="flex flex-col gap-space-xs">
        <h1 className="text-headline-lg tracking-tight text-text">
          Hello, {user.name.split(" ")[0]}
        </h1>
        <p className="max-w-[70ch] text-body-lg leading-7 text-muted">
          {farm
            ? `Here is how your flocks are doing today. ${farm.name}.`
            : "Set up your farm in Settings to personalise this."}
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
        {/* ── Left / primary column: 7 of 12 ─────────────────────────── */}
        <div className="flex flex-col gap-space-lg lg:col-span-7">
          {/* Production card */}
          <section className={card} aria-labelledby="today-flock">
            <div className="flex items-start justify-between gap-space-md">
              <div className="min-w-0">
                <span className="mb-space-sm inline-flex items-center gap-space-xs rounded-full border border-border bg-[#F1F3FF] px-2.5 py-1 text-label-base text-muted">
                  <Egg className="h-4 w-4 text-success" aria-hidden="true" />
                  Active Flock
                </span>
                <h2 id="today-flock" className="text-headline-md text-text">
                  Today at {activeFlock ? activeFlock.name : "your farm"}
                </h2>
              </div>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F1F3FF]">
                <Egg className="h-7 w-7 text-accent" aria-hidden="true" />
              </span>
            </div>

            <div className="flex flex-baseline items-baseline gap-space-sm">
              <span className="text-display-stat tabular-nums tracking-tight text-text">
                {stats?.hasTodayLog ? stats.todayEggs : "—"}
              </span>
              <span className="text-body-lg font-normal text-muted">eggs</span>
            </div>
            <p className="text-body-lg leading-7 text-muted">
              {stats?.hasTodayLog && layingRatePct !== null
                ? `from ${hensToday} hens (${layingRatePct}% laying rate)`
                : "No log yet for today."}
            </p>

            <div className="pt-space-sm">
              <Link href={addTodayAction.href} className={btnPrimary}>
                <Plus className="h-6 w-6" aria-hidden="true" />
                Add today&apos;s eggs
              </Link>
            </div>
          </section>

          {/* Two small cards side by side */}
          <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
            <section className={card} aria-label="Money today">
              <div className="flex items-center justify-between">
                <span className="text-label-base text-muted">Money today</span>
                <Banknote className="h-5 w-5 text-muted" aria-hidden="true" />
              </div>
              <div className="mt-space-sm flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    stats?.profit && !stats.profit.isLoss
                      ? "bg-success"
                      : stats?.profit
                        ? "bg-danger"
                        : "bg-border"
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={`text-headline-sm ${
                    stats?.profit?.isLoss
                      ? "text-danger"
                      : stats?.profit
                        ? "text-success"
                        : "text-muted"
                  }`}
                >
                  {stats?.profit?.isLoss ? "Loss" : "Profit"}
                </span>
              </div>
              <p className="text-headline-md tabular-nums text-text">
                {stats?.profit
                  ? formatNaira(Math.abs(stats.profit.profitKobo))
                  : "—"}
              </p>
              <p className="text-body-base leading-6 text-muted">
                {stats?.profit
                  ? `Revenue ${formatNaira(stats.profit.revenueKobo)} · feed ${formatNaira(stats.profit.costKobo)}`
                  : !stats
                    ? "Set up your farm to see profit."
                    : !stats.hasTodayLog
                      ? "Log today's eggs and feed to see profit."
                      : feedPriceKobo === null
                        ? "Set your feed price in Settings to see profit."
                        : "The tray price is unavailable right now."}
              </p>
            </section>

            <section className={card} aria-label="Eggs in store">
              <div className="flex items-center justify-between">
                <span className="text-label-base text-muted">Eggs in store</span>
                <DataSourceBadge kind="simulated" />
              </div>
              <p className="mt-space-sm text-headline-md tabular-nums text-text">
                {stats ? `${stats.stockEggs} eggs` : "—"}
              </p>
              <p className="text-body-base text-muted">
                {stats && stats.stockValueKobo !== null
                  ? `Worth ${formatNaira(stats.stockValueKobo)}`
                  : "No tray price yet"}
              </p>
              <p className="text-body-base text-muted">Ready for delivery</p>
            </section>
          </div>

          {/* Heat banner — same real alert and same DEMO_MODE preview switch */}
          <HeatBanner heat={heat} demoMode={demoMode} />

          {/* Two-row card: weather now, then the market price */}
          <section className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
            <div className="flex items-center justify-between gap-space-md p-space-lg">
              <div className="flex min-w-0 items-center gap-space-md">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F3FF]">
                  <Egg className="h-5 w-5 text-info" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-body-lg-bold leading-7 text-text">
                    {weather.status === "error"
                      ? "Weather is unavailable right now."
                      : `Weather now: ${Math.round(weather.data.current.tempC)}°C, ${weather.data.current.text}`}
                  </p>
                  <p className="text-body-base leading-6 text-muted">
                    {weatherFarm.name}
                  </p>
                </div>
              </div>
              {weather.status === "ok" && (
                <DataSourceBadge kind="live" detail="updated just now" />
              )}
              {weather.status === "saved" && (
                <DataSourceBadge kind="saved" detail="saved" />
              )}
            </div>

            <div className="mx-space-lg h-px bg-border" />

            <div className="flex items-center justify-between gap-space-md p-space-lg">
              <div className="flex min-w-0 items-center gap-space-md">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F3FF]">
                  <Banknote className="h-5 w-5 text-accent" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-body-lg-bold leading-7 text-text">
                    Egg tray price:{" "}
                    {trayPriceKobo !== null
                      ? formatNaira(trayPriceKobo)
                      : "unavailable"}
                  </p>
                  <p className="text-body-base leading-6 text-muted">
                    {eggPrice.changePct === null
                      ? "No change to show yet."
                      : eggPrice.changePct >= 0
                        ? `Up ${Math.abs(eggPrice.changePct).toFixed(1)}% since yesterday`
                        : `Down ${Math.abs(eggPrice.changePct).toFixed(1)}% since yesterday`}
                  </p>
                </div>
              </div>
              <DataSourceBadge kind="simulated" />
            </div>
          </section>

          {/* The dashboard's own cards keep their badges and their
              weather-retry path; they sit under the two-row summary. */}
          <div className="grid gap-space-lg lg:grid-cols-2">
            <EggPriceCard data={eggPrice} />
            <WeatherCard
              farm={weatherFarm}
              farmName={weatherFarm.name}
              preloaded={weather}
            />
          </div>

          {!farm && (
            <p className={card}>
              No farm yet.{" "}
              <Link href="/settings" className="font-semibold text-accent">
                Add your farm in Settings
              </Link>{" "}
              so weather, feed cost and profit match your location.
            </p>
          )}
        </div>

        {/* ── Right column: charts as accordions, 5 of 12 ────────────── */}
        <div className="flex flex-col gap-space-lg lg:col-span-5">
          <EggBarsCard
            id="dash-eggs"
            icon={<Egg className="h-6 w-6 text-accent" aria-hidden="true" />}
            title="Eggs this week"
            badge={<DataSourceBadge kind="saved" />}
            points={eggPoints}
            emptyAction={addTodayAction}
            summary={
              <>
                Total 7 days:{" "}
                <strong className="font-semibold text-text">
                  {eggTotal} eggs
                </strong>
                {eggDays > 0 && (
                  <span className="ml-2 text-muted">
                    across {eggDays} logged {eggDays === 1 ? "day" : "days"}
                  </span>
                )}
              </>
            }
          />
          <StockPieCard
            id="dash-stock-value"
            title="Stock value by flock"
            badge={<DataSourceBadge kind="simulated" />}
            slices={stockSlices}
            priceDate={eggPrice.priceDate}
            emptySentence={
              trayPriceKobo === null
                ? "The tray price is unavailable right now."
                : "No eggs in stock yet."
            }
            emptyAction={
              trayPriceKobo === null
                ? { href: "/market", label: "Open Prices" }
                : addTodayAction
            }
          />
        </div>
      </div>
    </div>
  );
}
