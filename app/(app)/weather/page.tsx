// Weather (docs/03-hencount.md page 8, design.md S-WEATHER): current
// conditions for the farm's own coordinates, the 5-day forecast cards, the
// heat alert when it applies, and the data-source badge that says whether
// this is live or saved.
import { AlertTriangle, MapPin, RefreshCw } from "lucide-react";
import Link from "next/link";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { heatAlert } from "@/lib/alerts";
import { DEFAULT_FARM } from "@/lib/config";
import { formatAge, formatDayShort } from "@/lib/dates";
import { getFarmForUser } from "@/lib/data";
import { requireUser } from "@/lib/session";
import { loadWeather } from "@/lib/weather/load";
import type { WeatherDay } from "@/lib/weather/types";

export const dynamic = "force-dynamic";

const card = "rounded-card border border-border bg-surface p-6 shadow-card";

export default async function WeatherPage() {
  const user = await requireUser();
  const farm = await getFarmForUser(user.userId);
  const place = farm ?? DEFAULT_FARM;
  const weather = await loadWeather(place);
  const alert = weather.status !== "error" ? heatAlert(weather.data.daily) : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-text">Weather</h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-base leading-6 text-muted">
          <MapPin className="h-4 w-4" aria-hidden="true" />
          {place.name} · {place.lat.toFixed(4)}, {place.lon.toFixed(4)}
          <Link href="/settings" className="font-medium text-accent">
            Change location
          </Link>
        </p>
      </header>

      {weather.status === "error" ? (
        <section className={card}>
          <p className="text-base leading-6 text-danger">{weather.message}</p>
          <Link
            href="/weather"
            className="mt-4 inline-flex h-12 items-center gap-2 rounded-input border border-border bg-surface px-4 text-base font-semibold text-text hover:bg-bg"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </Link>
        </section>
      ) : (
        <>
          {alert && (
            <p
              role="status"
              className="inline-flex items-start gap-2 rounded-card bg-warning-bg px-4 py-3 text-base font-medium text-warning"
            >
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <span>
                {alert.message} ({formatDayShort(new Date(`${alert.date}T12:00:00Z`))},{" "}
                {Math.round(alert.maxC)} °C)
              </span>
            </p>
          )}

          <section className={card} aria-labelledby="now">
            <div className="flex items-start justify-between gap-3">
              <h2 id="now" className="text-sm font-medium text-muted">
                Now
              </h2>
              {weather.status === "ok" ? (
                <DataSourceBadge kind="live" detail="updated just now" />
              ) : (
                <DataSourceBadge
                  kind="saved"
                  detail={formatAge(weather.ageMinutes)}
                />
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-3">
              <p className="text-4xl font-bold tabular-nums text-text">
                {Math.round(weather.data.current.tempC)}°C
              </p>
              <p className="text-lg text-muted">{weather.data.current.text}</p>
            </div>
            <p className="mt-1 text-base text-muted">
              Humidity {Math.round(weather.data.current.humidity)}% · Wind{" "}
              {Math.round(weather.data.current.windKmh)} km/h
            </p>
            {weather.status === "saved" && (
              <p className="mt-3 text-sm leading-6 text-muted">
                The weather service did not answer, so this is the last saved
                reading.
              </p>
            )}
          </section>

          <section aria-labelledby="forecast">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="forecast" className="text-lg font-semibold text-text">
                Next 5 days
              </h2>
              <p className="text-sm text-muted">High / low · rain</p>
            </div>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {weather.data.daily.map((day: WeatherDay) => (
                <li
                  key={day.date}
                  className="rounded-card border border-border bg-surface p-4 shadow-card"
                >
                  <p className="text-sm font-medium text-text">
                    {formatDayShort(new Date(`${day.date}T12:00:00Z`))}
                  </p>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-text">
                    {Math.round(day.maxC)}°
                    <span className="text-base font-normal text-muted">
                      {" "}
                      / {Math.round(day.minC)}°
                    </span>
                  </p>
                  <p className="mt-1 text-sm tabular-nums text-muted">
                    {day.rainMm} mm · {day.rainChancePct}% rain
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className={card} aria-labelledby="tip">
            <h2 id="tip" className="text-lg font-semibold text-text">
              What this means for the hens
            </h2>
            <p className="mt-2 max-w-[70ch] leading-6 text-muted">
              {alert
                ? "A hot day is coming. Give cool water and shade, and expect eggs to dip that day."
                : "Nothing in this forecast is above the sample heat threshold. Keep the water clean and watch the feed."}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              The heat threshold is a sample. A poultry expert must confirm it
              before you act on it.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
