// Eggs (docs/03-hencount.md page 1): every flock on this farm with today's
// status and what is in stock, the way into Add today / Advice / Sell, and
// the form that creates a new flock. Only this farmer's flocks are read.
import { CheckCircle2, CircleAlert, Egg, Plus } from "lucide-react";
import Link from "next/link";
import { AddFlockForm } from "@/components/AddFlockForm";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { FlockCardActions } from "@/components/FlockCardActions";
import { loadEggPrice } from "@/components/EggPriceCard";
import { formatNaira, todayInAppTz } from "@/lib/dates";
import { getFarmForUser, getFlocksForFarm } from "@/lib/data";
import { stockFor } from "@/lib/flocks";
import { logOnDate } from "@/lib/flocks";
import { stockValueKobo } from "@/lib/eggs";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function EggsPage() {
  const user = await requireUser();
  const farm = await getFarmForUser(user.userId);
  const today = todayInAppTz();

  const flocks = farm ? await getFlocksForFarm(farm.id, user.userId) : [];
  const eggPrice = await loadEggPrice();
  const trayPriceKobo = eggPrice.priceKobo;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-text">Eggs</h1>
        <p className="mt-1 max-w-[70ch] leading-6 text-muted">
          One card per flock: today&apos;s log, what is in stock, and the way
          to add a day or sell eggs.
        </p>
      </header>

      {flocks.length === 0 ? (
        <section className="rounded-card border border-border bg-surface p-6 shadow-card">
          <div className="flex items-start gap-3">
            <Egg className="mt-0.5 h-6 w-6 shrink-0 text-accent" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-semibold text-text">No flocks yet</h2>
              <p className="mt-1 max-w-[60ch] leading-6 text-muted">
                A flock is a group of hens that live and lay together. Add your
                first one, then log its eggs and feed each day.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {flocks.map((flock) => {
            const todayLog = logOnDate(flock.logs, today);
            const stock = stockFor(flock.logs, flock.sales);
            const value =
              trayPriceKobo === null
                ? null
                : stockValueKobo(stock, trayPriceKobo);

            return (
              <section
                key={flock.id}
                className="rounded-card border border-border bg-surface p-6 shadow-card"
                aria-labelledby={`flock-${flock.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h2
                    id={`flock-${flock.id}`}
                    className="text-lg font-semibold text-text"
                  >
                    {flock.name}
                  </h2>
                  {todayLog ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-1 text-sm font-medium text-success">
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      Logged today
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-bg px-2.5 py-1 text-sm font-medium text-warning">
                      <CircleAlert className="h-4 w-4" aria-hidden="true" />
                      No log today
                    </span>
                  )}
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-sm text-muted">Today&apos;s eggs</dt>
                    <dd className="text-2xl font-bold tabular-nums text-text">
                      {todayLog ? todayLog.eggs : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted">In stock</dt>
                    <dd className="text-2xl font-bold tabular-nums text-text">
                      {stock} eggs
                    </dd>
                  </div>
                </dl>

                {value !== null && (
                  <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted">
                    Stock value {formatNaira(value)}
                    <DataSourceBadge kind="simulated" />
                  </p>
                )}
                {trayPriceKobo === null && (
                  <p className="mt-2 text-sm text-muted">
                    Stock value needs today&apos;s tray price, which is
                    unavailable right now.
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/eggs/${flock.id}/add`}
                    className="inline-flex h-12 items-center gap-2 rounded-input bg-accent px-4 text-base font-semibold text-white"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add today
                  </Link>
                  <Link
                    href={`/eggs/${flock.id}/advice`}
                    className="inline-flex h-12 items-center rounded-input border border-border bg-surface px-4 text-base font-semibold text-text hover:bg-bg"
                  >
                    Advice
                  </Link>
                  <Link
                    href={`/eggs/${flock.id}/sell`}
                    className="inline-flex h-12 items-center rounded-input border border-border bg-surface px-4 text-base font-semibold text-text hover:bg-bg"
                  >
                    Sell eggs
                  </Link>
                </div>

                <div className="mt-3 border-t border-border pt-2">
                  <FlockCardActions flockId={flock.id} flockName={flock.name} />
                </div>
              </section>
            );
          })}
        </div>
      )}

      <section className="rounded-card border border-border bg-surface p-6 shadow-card">
        <h2 className="text-lg font-semibold text-text">Add a flock</h2>
        <p className="mt-1 max-w-[60ch] leading-6 text-muted">
          Give the group a name you will recognise, like &ldquo;Mango Creek
          layers&rdquo;.
        </p>
        <AddFlockForm />
      </section>
    </div>
  );
}
