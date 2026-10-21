// Advice (docs/03-hencount.md page 4): a status pill with icon and word, the
// one advice sentence from adviceFor, and three stat cards. Thresholds are
// samples in /lib/config.ts — a poultry expert must confirm them.
import { Crop } from "@prisma/client";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Egg,
  Info,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatCard } from "@/components/StatCard";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { btnPrimary, btnSecondary, card } from "@/components/ui";
import { EggBarsCard } from "@/components/charts/EggBarsCard";
import { ProfitCard } from "@/components/charts/ProfitCard";
import { adviceFor, dayMoney, metricsFor } from "@/lib/eggs";
import type { AdviceStatus } from "@/lib/eggs";
import { eggsSeries, profitSeries } from "@/lib/charts";
import type { MarketTick } from "@/lib/market/generator";
import { getMarketProvider } from "@/lib/market/provider";
import { dateKey, formatNaira, todayInAppTz } from "@/lib/dates";
import { getFlockForUser } from "@/lib/data";
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

  // Speed (step 6): the feed price and the tray-price history do not
  // depend on each other, so they are fetched together. One history call
  // feeds both the profit chart and today's profit card.
  const [feedPrice, history] = await Promise.all([
    db.feedPrice.findFirst({ where: { farm: { userId: user.userId } } }),
    getMarketProvider()
      .getHistory(Crop.EGGS_TRAY, 7)
      .catch(() => [] as MarketTick[]),
  ]);

  const logs = flock.logs.map((log) => ({
    date: dateKey(log.date),
    hens: log.hens,
    eggs: log.eggs,
    feedKg: log.feedKg,
  }));
  const advice = adviceFor(logs);

  const today = todayInAppTz();

  // Chart data (step 5): the 7-day series with gaps kept as gaps. With no
  // prices the profit chart shows gaps too — never invented numbers.
  const eggPoints = eggsSeries(logs, today, 7);
  const trayPriceByDate = Object.fromEntries(
    history.map((tick) => [tick.date, tick.priceKobo]),
  );
  const trayPriceKobo =
    history.length > 0 ? history[history.length - 1].priceKobo : null;
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

  const profit =
    todayLog && trayPriceKobo !== null && feedPrice
      ? dayMoney(
          { eggs: todayLog.eggs, feedKg: todayLog.feedKg },
          {
            trayPriceKobo,
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
          className="inline-flex items-center gap-1 text-body-base font-semibold text-accent"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          All flocks
        </Link>
        <h1 className="mt-2 text-headline-lg tracking-tight text-text">
          Advice for {flock.name}
        </h1>
        <p className="mt-1 max-w-[70ch] text-body-lg leading-7 text-muted">
          Based on the last {advice.daysUsed} day
          {advice.daysUsed === 1 ? "" : "s"} logged.
        </p>
      </div>

      {/* The mockup's hero: the status in words first, then the two numbers
          it was decided from, at display-stat. */}
      <section className={card} aria-labelledby="advice-status">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-label-base font-semibold ${pill.className}`}
        >
          <PillIcon className="h-5 w-5" aria-hidden="true" />
          {pill.label}
        </span>
        <p id="advice-status" className="mt-4 max-w-[24ch] text-headline-lg text-text">
          {advice.message}
        </p>

        <div className="mt-space-lg grid grid-cols-1 gap-space-md sm:grid-cols-2">
          <div>
            <p className="text-label-base text-muted">Average laying rate</p>
            <p className="text-display-stat tabular-nums text-text">
              {advice.avgLayingRatePct === null
                ? "—"
                : `${Math.round(advice.avgLayingRatePct)}%`}
            </p>
          </div>
          <div>
            <p className="text-label-base text-muted">Average feed per hen</p>
            <p className="text-display-stat tabular-nums text-text">
              {advice.avgFeedPerHenG === null
                ? "—"
                : `${Math.round(advice.avgFeedPerHenG)} g`}
            </p>
          </div>
        </div>

        {advice.status === "KEEP_ADDING" && (
          <p className="mt-3 text-body-base leading-6 text-muted">
            {advice.daysUsed} of 3 days logged. Advice needs 3.
          </p>
        )}
        <p className="mt-space-md text-body-base leading-6 text-muted">
          These thresholds are samples. A poultry expert must confirm them
          before you act on them.
        </p>
      </section>

      <div className="grid gap-space-md sm:grid-cols-2 lg:grid-cols-3">
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

      <div className="grid gap-space-lg lg:grid-cols-2">
        <EggBarsCard
          id="advice-eggs"
          icon={<Egg className="h-6 w-6 text-accent" aria-hidden="true" />}
          title="Eggs this week"
          badge={<DataSourceBadge kind="saved" />}
          points={eggPoints}
          showThreshold
          emptySentence={eggEmptySentence}
          emptyAction={{ href: `/eggs/${flock.id}/add`, label: "Add today" }}
        />
        <ProfitCard
          id="advice-profit"
          icon={<Banknote className="h-6 w-6 text-accent" aria-hidden="true" />}
          title="Profit per day"
          badge={<DataSourceBadge kind="simulated" detail="tray price" />}
          points={profitPoints}
          emptySentence={profitEmpty.sentence}
          emptyAction={profitEmpty.action}
        />
      </div>

      <div className="flex flex-wrap gap-space-sm">
        <Link href={`/eggs/${flock.id}/add`} className={btnPrimary}>
          <Plus className="h-6 w-6" aria-hidden="true" />
          Add today
        </Link>
        <Link href={`/eggs/${flock.id}/sell`} className={btnSecondary}>
          Sell eggs
        </Link>
      </div>

      <p className="max-w-[70ch] text-body-base leading-6 text-muted">
        Advice is checked again every time you save a day.
      </p>
    </div>
  );
}
