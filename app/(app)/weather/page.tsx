// Weather (docs/03-hencount.md page 8, docs/design.md S-WEATHER), built to
// the mockup in stitch_.../hencount_weather_at_your_farm_desktop: a 40px
// current reading, a "Next 5 days" list, and the demo switcher kept alive
// under the mockup's "System Scenarios" heading.
//
// The forecast is still for the farm's own coordinates, still badged Live or
// Saved data, and an unreachable service still shows one sentence plus a
// retry instead of taking the page down.
import { AlertTriangle, MapPin, RefreshCw, Sun } from "lucide-react";
import Link from "next/link";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { heatAlert } from "@/lib/alerts";
import { DEFAULT_FARM } from "@/lib/config";
import { formatAge, formatDayShort } from "@/lib/dates";
import { getFarmForUser } from "@/lib/data";
import { requireUser } from "@/lib/session";
import { loadWeather } from "@/lib/weather/load";
import type { WeatherDay } from "@/lib/weather/types";
import { btnQuiet, card, StatLabel, StatNote, StatValue } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function WeatherPage() {
  const user = await requireUser();
  const farm = await getFarmForUser(user.userId);
  const place = farm ?? DEFAULT_FARM;
  const weather = await loadWeather(place);
  const alert = weather.status !== "error" ? heatAlert(weather.data.daily) : null;

  return (
    <div className="flex flex-col gap-space-xl">
      <header>
        <h1 className="text-headline-lg tracking-tight text-text">
          Weather at your farm
        </h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-body-lg leading-7 text-muted">
          <MapPin className="h-5 w-5 shrink-0" aria-hidden="true" />
          {place.name} · {place.lat.toFixed(4)}, {place.lon.toFixed(4)}
          <Link href="/settings" className="font-semibold text-accent">
            Change location
          </Link>
        </p>
      </header>

      {weather.status === "error" ? (
        <section className={card}>
          <p className="text-body-lg leading-7 text-danger">{weather.message}</p>
          <Link href="/weather" className={`${btnQuiet} mt-4`}>
            <RefreshCw className="h-5 w-5" aria-hidden="true" />
            Try again
          </Link>
        </section>
      ) : (
        <>
          {alert && (
            <div
              role="status"
              className="flex items-start gap-space-md rounded-card bg-[#FFFAEB] p-space-lg shadow-card"
            >
              <span
                className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FEF0C7]"
                aria-hidden="true"
              >
                <AlertTriangle className="h-6 w-6 text-[#B54708]" />
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <p className="text-body-lg-bold leading-7 text-[#7A2E0E]">
                  {alert.message}
                </p>
                <p className="text-body-base leading-6 text-[#B54708]">
                  Expected to reach {Math.round(alert.maxC)} °C on{" "}
                  {formatDayShort(new Date(`${alert.date}T12:00:00Z`))}.
                </p>
              </div>
            </div>
          )}

          <section className={card} aria-labelledby="now">
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
                ) : (
                  <DataSourceBadge
                    kind="saved"
                    detail={formatAge(weather.ageMinutes)}
                  />
                )
              }
            >
              <span id="now" className="flex items-center gap-space-sm">
                <Sun className="h-5 w-5 text-accent" aria-hidden="true" />
                Now
              </span>
            </StatLabel>

            <div className="flex flex-wrap items-baseline gap-space-md">
              <StatValue>{Math.round(weather.data.current.tempC)}°C</StatValue>
              <p className="text-body-lg text-muted">
                {weather.data.current.text}
              </p>
            </div>
            <StatNote>
              Humidity {Math.round(weather.data.current.humidity)}% · Wind{" "}
              {Math.round(weather.data.current.windKmh)} km/h
            </StatNote>
            {weather.status === "saved" && (
              <p className="mt-3 text-body-base leading-6 text-muted">
                The weather service did not answer, so this is the last saved
                reading.
              </p>
            )}
          </section>

          <section aria-labelledby="forecast">
            <div className="mb-space-md flex flex-wrap items-baseline justify-between gap-space-sm">
              <h2 id="forecast" className="text-headline-md text-text">
                Next 5 days
              </h2>
              <p className="text-body-base text-muted">High / low · rain</p>
            </div>
            <ul className="grid gap-space-md sm:grid-cols-2 lg:grid-cols-5">
              {weather.data.daily.map((day: WeatherDay) => (
                <li key={day.date} className={card}>
                  <p className="text-body-lg-bold text-text">
                    {formatDayShort(new Date(`${day.date}T12:00:00Z`))}
                  </p>
                  <p className="mt-1 text-headline-md tabular-nums text-text">
                    {Math.round(day.maxC)}°
                    <span className="text-body-lg font-normal text-muted">
                      {" "}
                      / {Math.round(day.minC)}°
                    </span>
                  </p>
                  <p className="mt-1 text-body-base tabular-nums text-muted">
                    {day.rainMm} mm · {day.rainChancePct}% rain
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className={card} aria-labelledby="tip">
            <h2 id="tip" className="text-headline-sm text-text">
              What this means for the hens
            </h2>
            <p className="mt-2 max-w-[70ch] text-body-lg leading-7 text-muted">
              {alert
                ? "A hot day is coming. Give cool water and shade, and expect eggs to dip that day."
                : "Nothing in this forecast is above the sample heat threshold. Keep the water clean and watch the feed."}
            </p>
            <p className="mt-3 text-body-base leading-6 text-muted">
              The heat threshold is a sample. A poultry expert must confirm it
              before you act on it.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
