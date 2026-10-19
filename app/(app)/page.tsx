// Dashboard (docs/03-hencount.md §2): stat cards for today's eggs, stock
// value and profit today (real seeded values through /lib/eggs.ts maths),
// the egg tray price card and weather card with their data-source badges,
// and a heat alert banner when a hot day is forecast. No charts yet (step 5).
import { Crop } from "@prisma/client";
import { Plus } from "lucide-react";
import Link from "next/link";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { EggBarsCard } from "@/components/charts/EggBarsCard";
import { StockPieCard } from "@/components/charts/StockPieCard";
import { HeatBanner } from "@/components/HeatBanner";
import { EggPriceCard, loadEggPrice } from "@/components/EggPriceCard";
import { StatCard } from "@/components/StatCard";
import { WeatherCard } from "@/components/WeatherCard";
import { heatAlert } from "@/lib/alerts";
import { DEFAULT_FARM } from "@/lib/config";
import { computeDashboard, type DashboardStats } from "@/lib/dashboard";
import { eggsSeriesAllFlocks, stockValueSlices, type StockSlice } from "@/lib/charts";
import { dateKey, formatNaira, todayInAppTz } from "@/lib/dates";
import { getFarmForUser, getFlocksForFarm } from "@/lib/data";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { loadWeather } from "@/lib/weather/load";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // The session's own user; every read below is scoped to their farm.
  const user = await requireUser();
  const farm = await getFarmForUser(user.userId);
  const today = todayInAppTz();
  const todayKey = dateKey(today);
  const demoMode = process.env.DEMO_MODE === "true";

  const eggPrice = await loadEggPrice();
  const trayPriceKobo = eggPrice.priceKobo;

  let stats: DashboardStats | null = null;
  let feedPriceKobo: number | null = null;
  let flocks: Awaited<ReturnType<typeof getFlocksForFarm>> = [];
  let eggPoints: { date: string; eggs: number | null }[] = [];
  let stockSlices: StockSlice[] = [];
  if (farm) {
    flocks = await getFlocksForFarm(farm.id, user.userId);
    const feedPrice = await db.feedPrice.findUnique({
      where: { farmId: farm.id },
    });
    feedPriceKobo = feedPrice?.priceKobo ?? null;
    stats = computeDashboard({
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
    });

    // Chart inputs: raw logs only — /lib/charts.ts keeps the gaps.
    eggPoints = eggsSeriesAllFlocks(
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
    if (trayPriceKobo !== null) {
      stockSlices = stockValueSlices(
        flocks.map((flock) => ({
          name: flock.name,
          laidEggs: flock.logs.reduce((sum, log) => sum + log.eggs, 0),
          soldEggs: flock.sales.reduce((sum, sale) => sum + sale.eggs, 0),
        })),
        trayPriceKobo,
      );
    }
  }

  const addTodayAction = {
    href: flocks[0] ? `/eggs/${flocks[0].id}/add` : "/eggs",
    label: "Add today",
  };

  const weatherFarm = farm ?? DEFAULT_FARM;
  const weather = await loadWeather(weatherFarm);
  const heat = weather.status !== "error" ? heatAlert(weather.data.daily) : null;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text">Dashboard</h1>
          <p className="mt-1 max-w-[70ch] leading-6 text-muted">
            Welcome back, {user.name.split(" ")[0]}.{" "}
            {farm ? farm.name : "Set up your farm in Settings to personalise this."}
          </p>
        </div>
        {/* The one main action on this screen (design.md §2). */}
        <Link
          href={flocks[0] ? `/eggs/${flocks[0].id}/add` : "/eggs"}
          className="inline-flex h-12 items-center gap-2 rounded-input bg-accent px-5 text-base font-semibold text-white"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          Add today
        </Link>
      </header>

      {/* Alerts banner (design.md §2): heat when a hot day is forecast.
          On a cool day the preview switch appears only when DEMO_MODE=true. */}
      <HeatBanner heat={heat} demoMode={demoMode} />

      {/* Top row: 3 stat cards (S-DASH). */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Today's eggs"
          value={stats?.hasTodayLog ? stats.todayEggs : "—"}
          note={
            stats?.hasTodayLog
              ? `Feed used today: ${stats.todayFeedKg} kg`
              : "No log yet for today."
          }
        />
        <StatCard
          label="Stock value"
          badge={<DataSourceBadge kind="simulated" />}
          value={
            stats?.stockValueKobo !== null && stats
              ? formatNaira(stats.stockValueKobo)
              : "—"
          }
          note={
            stats
              ? `${stats.stockEggs} eggs in stock` +
                (trayPriceKobo !== null
                  ? ` · valued at the tray price`
                  : " · no tray price yet")
              : "Set up your farm to see stock value."
          }
        />
        <StatCard
          label="Profit today"
          value={
            stats?.profit
              ? `${stats.profit.isLoss ? "Loss " : ""}${formatNaira(
                  Math.abs(stats.profit.profitKobo),
                )}`
              : "—"
          }
          tone={
            stats?.profit?.isLoss ? "danger" : stats?.profit ? "success" : "default"
          }
          note={
            stats?.profit
              ? `Revenue ${formatNaira(stats.profit.revenueKobo)} · feed ${formatNaira(
                  stats.profit.costKobo,
                )}`
              : !stats
                ? "Set up your farm to see profit."
                : !stats.hasTodayLog
                  ? "Log today's eggs and feed to see profit."
                  : feedPriceKobo === null
                    ? "Set your feed price in Settings to see profit."
                    : "The tray price is unavailable right now."
          }
        />
      </div>

      {/* Charts (step 5): eggs by day and the stock value split (design.md §4). */}
      <div className="grid gap-4 lg:grid-cols-2">
        <EggBarsCard
          id="dash-eggs"
          title="Eggs per day, all flocks, last 7 days"
          badge={<DataSourceBadge kind="saved" />}
          points={eggPoints}
          emptyAction={addTodayAction}
        />
        <StockPieCard
          id="dash-stock-value"
          title="Share of egg stock value by flock"
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
              ? { href: "/market", label: "Open Market" }
              : addTodayAction
          }
        />
      </div>

      {/* Data cards with their badges. */}
      <div className="grid gap-4 lg:grid-cols-3">
        <EggPriceCard data={eggPrice} />
        <div className="lg:col-span-2">
          <WeatherCard farm={weatherFarm} farmName={weatherFarm.name} />
        </div>
      </div>

      {!farm && (
        <p className="rounded-card border border-border bg-surface p-6 text-base leading-6 text-muted shadow-card">
          No farm yet.{" "}
          <Link href="/settings" className="font-medium text-accent">
            Add your farm in Settings
          </Link>{" "}
          so weather, feed cost and profit match your location.
        </p>
      )}
    </div>
  );
}
