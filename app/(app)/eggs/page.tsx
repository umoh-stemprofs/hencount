// Eggs / "My hens" (docs/03-hencount.md page 1), built to the mockup
// structure in stitch_.../hencount_my_hens_desktop: a header with the
// outlined "Add a flock" action, three farm-wide stat tiles
// (today's eggs · eggs in store · active flocks), then one card per flock
// in a 2-column grid with its status pill, its numbers and its actions.
//
// Every figure is summed from this farmer's own logs and sales — no new
// arithmetic, and only this farmer's flocks are read.
import { CheckCircle2, CircleAlert, Egg, Plus } from "lucide-react";
import Link from "next/link";
import { AddFlockForm } from "@/components/AddFlockForm";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { FlockCardActions } from "@/components/FlockCardActions";
import { loadEggPrice } from "@/components/EggPriceCard";
import { btnPrimary, btnSecondary, card, StatLabel, StatValue } from "@/components/ui";
import { formatNaira, todayInAppTz } from "@/lib/dates";
import { getFarmForUser, getFlocksForFarm } from "@/lib/data";
import { logOnDate, stockFor } from "@/lib/flocks";
import { stockValueKobo } from "@/lib/eggs";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

/** The mockup's outlined header action: 2px ochre, transparent fill. */
const btnOutlineAccent =
  "inline-flex h-[52px] items-center justify-center gap-space-sm rounded-card border-2 border-accent bg-surface px-space-lg text-label-lg text-accent transition-colors hover:bg-[#FFF7ED]";

export default async function EggsPage() {
  // Speed (step 6): the farm and the tray price are independent, so they
  // are fetched together; the flocks need the farm id and come next.
  const user = await requireUser();
  const [farm, eggPrice] = await Promise.all([
    getFarmForUser(user.userId),
    loadEggPrice(),
  ]);
  const today = todayInAppTz();
  const flocks = farm ? await getFlocksForFarm(farm.id, user.userId) : [];
  const trayPriceKobo = eggPrice.priceKobo;

  // The three farm-wide tiles the mockup shows above the flock grid.
  const todayEggs = flocks.reduce((sum, flock) => {
    const log = logOnDate(flock.logs, today);
    return sum + (log ? log.eggs : 0);
  }, 0);
  const stockEggs = flocks.reduce(
    (sum, flock) => sum + stockFor(flock.logs, flock.sales),
    0,
  );
  const stockValue =
    trayPriceKobo === null ? null : stockValueKobo(stockEggs, trayPriceKobo);

  return (
    <div className="flex flex-col gap-space-xl">
      <header className="flex flex-wrap items-start justify-between gap-space-md">
        <div className="min-w-0">
          <h1 className="text-headline-lg tracking-tight text-text">My hens</h1>
          <p className="mt-1 max-w-[70ch] text-body-lg leading-7 text-muted">
            One card per flock: today&apos;s log, what is in stock, and the way
            to add a day or sell eggs.
          </p>
        </div>
        <a href="#add-flock" className={btnOutlineAccent}>
          <Plus className="h-6 w-6" aria-hidden="true" />
          Add a flock
        </a>
      </header>

      {flocks.length === 0 ? (
        <section className={card} id="add-flock">
          <div className="flex items-start gap-3">
            <Egg className="mt-1 h-7 w-7 shrink-0 text-accent" aria-hidden="true" />
            <div>
              <h2 className="text-headline-sm text-text">No flocks yet</h2>
              <p className="mt-1 max-w-[60ch] text-body-lg leading-7 text-muted">
                A flock is a group of hens that live and lay together. Add your
                first one, then log its eggs and feed each day.
              </p>
            </div>
          </div>
          <div className="mt-space-lg">
            <AddFlockForm />
          </div>
        </section>
      ) : (
        <>
          {/* Farm-wide summary banner */}
          <div className="grid grid-cols-1 gap-space-lg md:grid-cols-3">
            <section className={card} aria-label="Today's total eggs">
              <StatLabel>Today&apos;s Total Eggs</StatLabel>
              <div className="flex items-baseline gap-space-xs">
                <span className="text-display-stat tabular-nums text-text">
                  {todayEggs}
                </span>
                <span className="text-body-lg-bold text-muted">eggs</span>
              </div>
            </section>

            <section className={card} aria-label="Eggs currently in store">
              <StatLabel>Eggs Currently In Store</StatLabel>
              <div className="flex items-baseline gap-space-xs">
                <span className="text-display-stat tabular-nums text-text">
                  {stockEggs}
                </span>
                <span className="text-body-lg-bold text-muted">eggs</span>
              </div>
            </section>

            <section className={card} aria-label="Total active flocks">
              <StatLabel>Total Active Flocks</StatLabel>
              <div className="flex items-baseline gap-space-xs">
                <span className="text-display-stat tabular-nums text-accent">
                  {flocks.length}
                </span>
                <span className="text-body-lg-bold text-muted">
                  {flocks.length === 1 ? "flock" : "flocks"}
                </span>
              </div>
            </section>
          </div>

          {/* Flocks grid */}
          <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-2">
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
                  className={card}
                  aria-labelledby={`flock-${flock.id}`}
                >
                  <div className="mb-space-md flex flex-wrap items-center justify-between gap-space-sm">
                    <h2
                      id={`flock-${flock.id}`}
                      className="min-w-0 text-headline-md text-text"
                    >
                      {flock.name}
                    </h2>
                    {todayLog ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success-bg px-3 py-1.5 text-label-base font-semibold text-success">
                        <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                        Logged today
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning-bg px-3 py-1.5 text-label-base font-semibold text-warning">
                        <CircleAlert className="h-5 w-5" aria-hidden="true" />
                        No log today
                      </span>
                    )}
                  </div>

                  <dl className="grid grid-cols-2 gap-space-md">
                    <div>
                      <dt className="text-label-base text-muted">
                        Today&apos;s eggs
                      </dt>
                      <dd className="text-headline-md tabular-nums text-text">
                        {todayLog ? todayLog.eggs : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-label-base text-muted">In stock</dt>
                      <dd className="text-headline-md tabular-nums text-text">
                        {stock} eggs
                      </dd>
                    </div>
                  </dl>

                  {value !== null ? (
                    <p className="mt-space-md flex flex-wrap items-center gap-2 text-body-base text-muted">
                      Stock value {formatNaira(value)}
                      <DataSourceBadge kind="simulated" />
                    </p>
                  ) : (
                    <p className="mt-space-md text-body-base leading-6 text-muted">
                      Stock value needs today&apos;s tray price, which is
                      unavailable right now.
                    </p>
                  )}

                  <div className="mt-space-lg flex flex-wrap gap-space-sm">
                    <Link href={`/eggs/${flock.id}/add`} className={btnPrimary}>
                      <Plus className="h-6 w-6" aria-hidden="true" />
                      Add today
                    </Link>
                    <Link href={`/eggs/${flock.id}/advice`} className={btnSecondary}>
                      Advice
                    </Link>
                    <Link href={`/eggs/${flock.id}/sell`} className={btnSecondary}>
                      Sell eggs
                    </Link>
                  </div>

                  <div className="mt-space-md border-t border-border pt-space-sm">
                    <FlockCardActions flockId={flock.id} flockName={flock.name} />
                  </div>
                </section>
              );
            })}
          </div>

          {/* Add a flock — the header button targets this anchor */}
          <section className={card} id="add-flock" aria-labelledby="add-flock-title">
            <h2 id="add-flock-title" className="text-headline-sm text-text">
              Add a flock
            </h2>
            <p className="mt-1 max-w-[60ch] text-body-base leading-6 text-muted">
              Give the group a name you will recognise, like &ldquo;Mango Creek
              layers&rdquo;.
            </p>
            <AddFlockForm />
          </section>
        </>
      )}
    </div>
  );
}
