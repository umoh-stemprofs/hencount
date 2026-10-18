// Weather card (kept from step 2, with its Live / Saved data badges) for
// the farm's own coordinates. Error state offers a retry and never takes
// the rest of the dashboard down (00-global.md §3).
import { AlertTriangle, RefreshCw } from "lucide-react";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { heatAlert } from "@/lib/alerts";
import { formatAge, formatDayShort } from "@/lib/dates";
import { loadWeather, type FarmLocation } from "@/lib/weather/load";

const card = "rounded-card border border-border bg-surface p-6 shadow-card";

export async function WeatherCard({
  farm,
  farmName,
}: {
  farm: FarmLocation;
  farmName: string;
}) {
  const weather = await loadWeather(farm);
  const alert =
    weather.status !== "error" ? heatAlert(weather.data.daily) : null;

  return (
    <section className={card} aria-labelledby="weather-title">
      <div className="flex items-start justify-between gap-3">
        <h2 id="weather-title" className="text-sm font-medium text-muted">
          Weather · {farmName}
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
            href="/weather"
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
