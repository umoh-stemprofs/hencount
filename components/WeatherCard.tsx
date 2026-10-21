// Weather card (kept from step 2, with its Live / Saved data badges) for
// the farm's own coordinates. Error state offers a retry and never takes
// the rest of the dashboard down (00-global.md §3).
import { AlertTriangle, RefreshCw } from "lucide-react";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { btnQuiet, card, StatLabel, StatNote, StatValue } from "@/components/ui";
import { heatAlert } from "@/lib/alerts";
import { formatAge, formatDayShort } from "@/lib/dates";
import { loadWeather, type FarmLocation } from "@/lib/weather/load";
import type { WeatherLoadResult } from "@/lib/weather/types";

export async function WeatherCard({
  farm,
  farmName,
  // Speed (step 6): the dashboard already loaded the weather in its
  // parallel wave — pass it in so the card does not repeat the fetch.
  preloaded,
}: {
  farm: FarmLocation;
  farmName: string;
  preloaded?: WeatherLoadResult;
}) {
  const weather = preloaded ?? (await loadWeather(farm));
  const alert =
    weather.status !== "error" ? heatAlert(weather.data.daily) : null;

  return (
    <section className={card} aria-labelledby="weather-title">
      <StatLabel
        trailing={
          weather.status === "ok" ? (
            <DataSourceBadge
              kind="live"
              detail={
                weather.ageMinutes === undefined
                  ? "updated just now"
                  : `updated ${formatAge(weather.ageMinutes)}`
              }
            />
          ) : weather.status === "saved" ? (
            <DataSourceBadge kind="saved" detail={formatAge(weather.ageMinutes)} />
          ) : undefined
        }
      >
        <span id="weather-title">Weather · {farmName}</span>
      </StatLabel>

      {weather.status === "error" ? (
        <>
          <p className="mt-3 text-body-lg leading-7 text-danger">
            {weather.message}
          </p>
          <a
            href="/weather"
            className={`${btnQuiet} mt-4`}
          >
            <RefreshCw className="h-5 w-5" aria-hidden="true" />
            Try again
          </a>
        </>
      ) : (
        <>
          <div className="mt-1 flex flex-wrap items-baseline gap-3">
            <StatValue>
              {Math.round(weather.data.current.tempC)}°C
            </StatValue>
            <p className="text-body-lg text-muted">
              {weather.data.current.text}
            </p>
          </div>
          <StatNote>
            Humidity {Math.round(weather.data.current.humidity)}% · Wind{" "}
            {Math.round(weather.data.current.windKmh)} km/h
          </StatNote>

          {alert && (
            <p className="mt-4 inline-flex items-start gap-2 rounded-card bg-warning-bg px-3 py-2 text-body-base font-medium text-warning">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
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
                <p className="text-body-base font-semibold text-text">
                  {formatDayShort(new Date(`${day.date}T12:00:00Z`))}
                </p>
                <p className="text-body-base tabular-nums text-muted">
                  {Math.round(day.minC)}° / {Math.round(day.maxC)}°
                </p>
                <p className="text-body-base tabular-nums text-muted">
                  {day.rainMm} mm · {day.rainChancePct}%
                </p>
              </li>
            ))}
          </ul>
          {weather.status === "saved" && (
            <p className="mt-3 text-body-base leading-6 text-muted">
              The weather service did not answer, so this is saved data.
            </p>
          )}
        </>
      )}
    </section>
  );
}
