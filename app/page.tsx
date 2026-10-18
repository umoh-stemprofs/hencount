// Home page (step 2): a plain egg-tray price card and a weather card, each
// with its data-source badge. The full dashboard comes in step 4.
import { Crop } from "@prisma/client";
import { AlertTriangle, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { heatAlert } from "@/lib/alerts";
import { DEFAULT_FARM } from "@/lib/config";
import { formatAge, formatDayShort, formatNaira, todayInAppTz } from "@/lib/dates";
import { getCrop } from "@/lib/market/catalog";
import { getMarketProvider } from "@/lib/market/provider";
import { loadWeather } from "@/lib/weather/load";

export const dynamic = "force-dynamic";

const card =
  "rounded-card border border-border bg-surface p-6 shadow-card";

async function eggPriceCard() {
  const meta = getCrop(Crop.EGGS_TRAY)!;
  const today = todayInAppTz();

  let priceKobo: number | null = null;
  let changePct: number | null = null;
  let failed = false;
  try {
    const provider = getMarketProvider();
    const ticks = await provider.getHistory(Crop.EGGS_TRAY, 2);
    priceKobo = ticks[ticks.length - 1]?.priceKobo ?? null;
    if (ticks.length === 2 && ticks[1].priceKobo > 0) {
      changePct = ((ticks[1].priceKobo - ticks[0].priceKobo) / ticks[0].priceKobo) * 100;
    }
  } catch {
    failed = true;
  }

  return (
    <section className={card} aria-labelledby="egg-price-title">
      <div className="flex items-start justify-between gap-3">
        <h2 id="egg-price-title" className="text-sm font-medium text-muted">
          Egg tray price
        </h2>
        <DataSourceBadge kind="simulated" />
      </div>
      {failed || priceKobo === null ? (
        <p className="mt-3 text-base leading-6 text-danger">
          Prices are unavailable right now. Try again in a few minutes.
        </p>
      ) : (
        <>
          <p className="mt-2 text-4xl font-bold tabular-nums text-text">
            {formatNaira(priceKobo)}
          </p>
          <p className="mt-1 text-sm text-muted">per tray of 30 eggs</p>
          {changePct !== null && (
            <p
              className={`mt-3 inline-flex items-center gap-1.5 text-sm font-medium ${
                changePct >= 0 ? "text-success" : "text-danger"
              }`}
            >
              {changePct >= 0 ? (
                <TrendingUp className="h-4 w-4" aria-hidden="true" />
              ) : (
                <TrendingDown className="h-4 w-4" aria-hidden="true" />
              )}
              {changePct >= 0 ? "Up" : "Down"} {Math.abs(changePct).toFixed(1)}% vs
              yesterday
            </p>
          )}
          <p className="mt-3 text-sm text-muted">
            As of {formatDayShort(today)} · {meta.label}
          </p>
        </>
      )}
    </section>
  );
}

async function weatherCard() {
  const weather = await loadWeather(DEFAULT_FARM);
  const alert =
    weather.status !== "error" ? heatAlert(weather.data.daily) : null;

  return (
    <section className={card} aria-labelledby="weather-title">
      <div className="flex items-start justify-between gap-3">
        <h2 id="weather-title" className="text-sm font-medium text-muted">
          Weather · {DEFAULT_FARM.name}
        </h2>
        {weather.status === "ok" && (
          <DataSourceBadge kind="live" detail="updated just now" />
        )}
        {weather.status === "saved" && (
          <DataSourceBadge kind="saved" detail={formatAge(weather.ageMinutes)} />
        )}
      </div>

      {weather.status === "error" ? (
        <>
          <p className="mt-3 text-base leading-6 text-danger">{weather.message}</p>
          <a
            href="/"
            className="mt-4 inline-flex h-12 items-center gap-2 rounded-input border border-border bg-surface px-4 text-sm font-semibold text-text hover:bg-bg"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </a>
        </>
      ) : (
        <>
          <div className="mt-2 flex items-baseline gap-3">
            <p className="text-4xl font-bold tabular-nums text-text">
              {Math.round(weather.data.current.tempC)}°C
            </p>
            <p className="text-base text-muted">{weather.data.current.text}</p>
          </div>
          <p className="mt-1 text-sm text-muted">
            Humidity {Math.round(weather.data.current.humidity)}% · Wind{" "}
            {Math.round(weather.data.current.windKmh)} km/h
          </p>

          {alert && (
            <p className="mt-4 inline-flex items-start gap-2 rounded-input bg-warning-bg px-3 py-2 text-sm font-medium text-warning">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {alert.message} ({alert.date})
              </span>
            </p>
          )}

          <ul className="mt-4 grid gap-2 sm:grid-cols-5">
            {weather.data.daily.map((day) => (
              <li
                key={day.date}
                className="rounded-input border border-border px-3 py-2"
              >
                <p className="text-sm font-medium text-text">
                  {formatDayShort(new Date(`${day.date}T12:00:00Z`))}
                </p>
                <p className="text-sm tabular-nums text-muted">
                  {Math.round(day.minC)}° / {Math.round(day.maxC)}°
                </p>
                <p className="text-sm tabular-nums text-muted">
                  {day.rainMm} mm · {day.rainChancePct}%
                </p>
              </li>
            ))}
          </ul>
          {weather.status === "saved" && (
            <p className="mt-3 text-sm text-muted">
              The weather service did not answer, so this is saved data.
            </p>
          )}
        </>
      )}
    </section>
  );
}

export default async function Home() {
  const [eggCard, weather] = await Promise.all([eggPriceCard(), weatherCard()]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-6">
        <p className="text-sm font-medium text-accent">HenCount</p>
        <h1 className="mt-1 text-2xl font-semibold text-text">
          Eggs, feed and profit
        </h1>
        <p className="mt-2 max-w-[70ch] leading-6 text-muted">
          Step 2: market prices and weather are live. The full dashboard,
          daily log and charts arrive in the next steps.
        </p>
      </header>

      <div className="grid gap-4">
        {eggCard}
        {weather}
      </div>

      <footer className="mt-8 max-w-[70ch] text-sm leading-6 text-muted">
        <p>
          Prices are a simulated live feed (deterministic sample data).
          Sample thresholds and prices are placeholders — an expert must
          review them before real use.
        </p>
        <p className="mt-2 font-medium text-text">
          Decision-support tool. You decide.
        </p>
      </footer>
    </main>
  );
}
