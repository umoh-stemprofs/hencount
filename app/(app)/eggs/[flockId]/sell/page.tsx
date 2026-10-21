// Sell eggs (docs/03-hencount.md page 6): the stock in hand and its value,
// then a form with the market tray price already filled in. A sale larger
// than the stock is refused on the server.
import { CheckCircle2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { SellEggsForm } from "@/components/SellEggsForm";
import { loadEggPrice } from "@/components/EggPriceCard";
import { card, StatLabel, StatNote, StatValue } from "@/components/ui";
import { formatDayShort, formatNaira, todayInAppTz } from "@/lib/dates";
import { getFlockForUser } from "@/lib/data";
import { stockValueKobo } from "@/lib/eggs";
import { stockFor } from "@/lib/flocks";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SellEggsPage({
  params,
}: {
  params: { flockId: string };
}) {
  // Speed (step 6): the flock and the tray price are independent.
  const user = await requireUser();
  const [flock, eggPrice] = await Promise.all([
    getFlockForUser(params.flockId, user.userId).catch(() => null),
    loadEggPrice(),
  ]);
  if (!flock) notFound();
  const stock = stockFor(flock.logs, flock.sales);
  const value =
    eggPrice.priceKobo === null
      ? null
      : stockValueKobo(stock, eggPrice.priceKobo);

  const recentSales = [...flock.sales].slice(-3).reverse();

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
          Sell eggs
        </h1>
        <p className="mt-1 max-w-[70ch] text-body-lg leading-7 text-muted">
          {flock.name} · {formatDayShort(todayInAppTz())}
        </p>
      </div>

      <section className={card} aria-label="Egg stock">
        <StatLabel trailing={value !== null ? <DataSourceBadge kind="simulated" /> : undefined}>
          Egg stock in hand
        </StatLabel>
        <div className="flex items-baseline gap-space-xs">
          <StatValue>{stock}</StatValue>
          <span className="text-body-lg-bold text-muted">eggs</span>
        </div>
        <StatNote>
          {value !== null
            ? `Worth ${formatNaira(value)} at today's tray price.`
            : "The tray price is unavailable, so the stock value is not shown."}
        </StatNote>
        <p className="mt-1 text-body-base text-muted">
          Stock = eggs laid − eggs sold, for this flock.
        </p>
      </section>

      <SellEggsForm
        flockId={flock.id}
        stock={stock}
        trayPriceKobo={eggPrice.priceKobo}
      />

      {/* The mockup's "Store Safety Rules" panel, carrying the app's real
          server rule rather than invented copy. */}
      <section className={card} aria-labelledby="store-rules">
        <h2 id="store-rules" className="text-headline-sm text-text">
          Store Safety Rules
        </h2>
        <ul className="mt-space-md flex flex-col gap-space-sm">
          <li className="flex items-start gap-space-sm text-body-lg leading-7 text-muted">
            <CheckCircle2
              className="mt-1 h-5 w-5 shrink-0 text-success"
              aria-hidden="true"
            />
            You cannot sell more eggs than you have in stock.
          </li>
          <li className="flex items-start gap-space-sm text-body-lg leading-7 text-muted">
            <CheckCircle2
              className="mt-1 h-5 w-5 shrink-0 text-success"
              aria-hidden="true"
            />
            Stock is eggs laid minus eggs sold, for this flock only.
          </li>
          <li className="flex items-start gap-space-sm text-body-lg leading-7 text-muted">
            <CheckCircle2
              className="mt-1 h-5 w-5 shrink-0 text-success"
              aria-hidden="true"
            />
            A sale larger than the stock is refused on the server, so the
            number you see here is never out of date.
          </li>
        </ul>
      </section>

      {recentSales.length > 0 && (
        <section className={card} aria-labelledby="recent-sales">
          <h2 id="recent-sales" className="text-headline-sm text-text">
            Recent sales
          </h2>
          <ul className="mt-space-sm divide-y divide-border">
            {recentSales.map((sale) => (
              <li
                key={sale.id}
                className="flex min-h-16 items-baseline justify-between gap-3 py-space-md text-body-lg"
              >
                <span className="text-text">
                  {formatDayShort(sale.date)} · {sale.eggs} eggs
                </span>
                <span className="tabular-nums font-semibold text-text">
                  {formatNaira(
                    Math.round(
                      (sale.eggs / 30) * sale.pricePerTrayKobo,
                    ),
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
