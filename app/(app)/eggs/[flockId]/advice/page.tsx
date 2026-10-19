// Advice (docs/03-hencount.md page 4): a status pill with icon and word, the
// one advice sentence from adviceFor, and three stat cards. Thresholds are
// samples in /lib/config.ts — a poultry expert must confirm them.
import { Crop } from "@prisma/client";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Info,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatCard } from "@/components/StatCard";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { EggBarsCard } from "@/components/charts/EggBarsCard";
import { ProfitCard } from "@/components/charts/ProfitCard";
import { loadEggPrice } from "@/components/EggPriceCard";
import { adviceFor, dayMoney, metricsFor } from "@/lib/eggs";
import type { AdviceStatus } from "@/lib/eggs";
import { eggsSeries, profitSeries } from "@/lib/charts";
import { getMarketProvider } from "@/lib/market/provider";
import { dateKey, formatNaira, todayInAppTz } from "@/lib/dates";
import { getFarmForUser, getFlockForUser } from "@/lib/data";
import { db } from "@/lib/db";
import { logOnDate } from "@/lib/flocks";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const PILL: Record<
  AdviceStatus,
  { label: string; className: string; Icon: typeof CheckCircle2 }
> = {
  GOOD: {
    label: "Laying well",
    className: "bg-success-bg text-success",
    Icon: CheckCircle2,
  },
  FEW_EGGS: {
    label: "Few eggs",
    className: "bg-warning-bg text-warning",
    Icon: AlertTriangle,
  },
  CHECK_HEALTH: {
    label: "Check health",
    className: "bg-warning-bg text-warning",
    Icon: AlertTriangle,
  },
  TOO_MUCH_FEED: {
    label: "Too much feed",
    className: "bg-warning-bg text-warning",
    Icon: Info,
  },
  KEEP_ADDING: {
    label: "Keep adding",
    className: "bg-info-bg text-info",
    Icon: Clock3,
  },
};

export default async function AdvicePage({
  params,
}: {
  params: { flockId: string };
}) {
  const user = await requireUser();
  const flock = await getFlockForUser(params.flockId, user.userId).catch(
    () => null,
  );
  if (!flock) notFound();

  const farm = await getFarmForUser(user.userId);
  const feedPrice = farm
    ? await db.feedPrice.findUnique({ where: { farmId: farm.id } })
    : null;

  const logs = flock.logs.map((log) => ({
    date: dateKey(log.date),
    hens: log.hens,
    eggs: log.eggs,
    feedKg: log.feedKg,
  }));
  const advice = adviceFor(logs);

  const today = todayInAppTz();

  // Chart data (step 5): the 7-day series with gaps kept as gaps.
  const eggPoints = eggsSeries(logs, today, 7);
  let trayPriceByDate: Record<string, number> = {};
  try {
    const history = await getMarketProvider().getHistory(Crop.EGGS_TRAY, 7);
    trayPriceByDate = Object.fromEntries(
      history.map((tick) => [tick.date, tick.priceKobo]),
    );
  } catch {
    // No prices → the profit chart shows gaps, never invented numbers.
    trayPriceByDate = {};
  }
  const profitPoints = profitSeries({
    logs,
    today,
    days: 7,
    trayPriceByDate,
    feedPriceKobo: feedPrice?.priceKobo ?? null,
  });
  const noLogsInWindow = eggPoints.every((point) => point.eggs === null);
  const eggEmptySentence =
    logs.length === 0
      ? "No days logged yet."
      : "No days logged in the last 7 days.";
  const profitEmpty = noLogsInWindow
    ? {
        sentence: eggEmptySentence,
        action: { href: `/eggs/${flock.id}/add`, label: "Add today" },
      }
    : !feedPrice
      ? {
          sentence: "Set your feed price in Settings to see profit.",
          action: { href: "/settings", label: "Open settings" },
        }
      : {
          sentence: "The tray price is unavailable right now.",
          action: { href: `/eggs/${flock.id}/advice`, label: "Try again" },
        };
  const todayLog = logOnDate(flock.logs, today);
  const latestLog = flock.logs.length > 0 ? flock.logs[flock.logs.length - 1] : null;

  // Today's numbers when they exist, otherwise the last day logged.
  const shown = todayLog ?? latestLog;
  const metrics = shown
    ? metricsFor({
        date: dateKey(shown.date),
        hens: shown.hens,
        eggs: shown.eggs,
        feedKg: shown.feedKg,
      })
    : null;

  const eggPrice = await loadEggPrice();
  const profit =
    todayLog && eggPrice.priceKobo !== null && feedPrice
      ? dayMoney(
          { eggs: todayLog.eggs, feedKg: todayLog.feedKg },
          {
            trayPriceKobo: eggPrice.priceKobo,
            feedPriceKobo: feedPrice.priceKobo,
          },
        )
      : null;

  const pill = PILL[advice.status];
  const PillIcon = pill.Icon;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/eggs"
          className="inline-flex items-center gap-1 text-sm font-medium text-accent"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          All flocks
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-text">Advice</h1>
        <p className="mt-1 max-w-[70ch] leading-6 text-muted">
          {flock.name} · based on the last {advice.daysUsed} day
          {advice.daysUsed === 1 ? "" : "s"} logged.
        </p>
      </div>

      <section className="rounded-card border border-border bg-surface p-6 shadow-card">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${pill.className}`}
        >
          <PillIcon className="h-4 w-4" aria-hidden="true" />
          {pill.label}
        </span>
        <p className="mt-4 max-w-[60ch] text-lg font-medium leading-7 text-text">
          {advice.message}
        </p>
        {advice.status === "KEEP_ADDING" ? (
          <p className="mt-2 text-sm text-muted">
            {advice.daysUsed} of 3 days logged. Advice needs 3.
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">
            Average laying rate {advice.avgLayingRatePct?.toFixed(0)}% · average
            feed per hen {advice.avgFeedPerHenG?.toFixed(0)} g.
          </p>
        )}
        <p className="mt-4 text-sm text-muted">
          These thresholds are samples. A poultry expert must confirm them
          before you act on them.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Eggs per 100 hens"
          value={metrics ? `${Math.round(metrics.layingRatePct)}%` : "—"}
          note={
            metrics
              ? todayLog
                ? "Today's laying rate."
                : "Last day logged."
              : "Log a day to see this."
          }
        />
        <StatCard
          label="Feed per hen"
          value={metrics ? `${Math.round(metrics.feedPerHenG)} g` : "—"}
          note={
            metrics
              ? todayLog
                ? "Feed used per hen today."
                : "Last day logged."
              : "Log a day to see this."
          }
        />
        <StatCard
          label="Profit today"
          value={
            profit
              ? `${profit.isLoss ? "Loss " : ""}${formatNaira(
                  Math.abs(profit.profitKobo),
                )}`
              : "—"
          }
          tone={profit?.isLoss ? "danger" : profit ? "success" : "default"}
          note={
            profit
              ? `Revenue ${formatNaira(profit.revenueKobo)} · feed ${formatNaira(
                  profit.costKobo,
                )}`
              : !todayLog
                ? "Log today to see profit."
                : !feedPrice
                  ? "Set your feed price in Settings."
                  : "The tray price is unavailable right now."
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <EggBarsCard
          id="advice-eggs"
          title="Eggs per day, last 7 days"
          badge={<DataSourceBadge kind="saved" />}
          points={eggPoints}
          showThreshold
          emptySentence={eggEmptySentence}
          emptyAction={{ href: `/eggs/${flock.id}/add`, label: "Add today" }}
        />
        <ProfitCard
          id="advice-profit"
          title="Profit per day"
          badge={<DataSourceBadge kind="simulated" detail="tray price" />}
          points={profitPoints}
          emptySentence={profitEmpty.sentence}
          emptyAction={profitEmpty.action}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/eggs/${flock.id}/add`}
          className="inline-flex h-12 items-center rounded-input bg-accent px-4 text-base font-semibold text-white"
        >
          Add today
        </Link>
        <Link
          href={`/eggs/${flock.id}/sell`}
          className="inline-flex h-12 items-center rounded-input border border-border bg-surface px-4 text-base font-semibold text-text hover:bg-bg"
        >
          Sell eggs
        </Link>
      </div>

      <p className="max-w-[70ch] text-sm leading-6 text-muted">
        Advice is checked again every time you save a day.
      </p>
    </div>
  );
}
