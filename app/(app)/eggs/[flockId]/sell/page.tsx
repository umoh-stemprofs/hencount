// Sell eggs (docs/03-hencount.md page 6): the stock in hand and its value,
// then a form with the market tray price already filled in. A sale larger
// than the stock is refused on the server.
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { SellEggsForm } from "@/components/SellEggsForm";
import { loadEggPrice } from "@/components/EggPriceCard";
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
  const user = await requireUser();
  const flock = await getFlockForUser(params.flockId, user.userId).catch(
    () => null,
  );
  if (!flock) notFound();

  const eggPrice = await loadEggPrice();
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
          className="inline-flex items-center gap-1 text-sm font-medium text-accent"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          All flocks
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-text">Sell eggs</h1>
        <p className="mt-1 max-w-[70ch] leading-6 text-muted">
          {flock.name} · {formatDayShort(todayInAppTz())}
        </p>
      </div>

      <section
        className="rounded-card border border-border bg-surface p-6 shadow-card"
        aria-label="Egg stock"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-sm font-medium text-muted">Egg stock in hand</h2>
          {value !== null && <DataSourceBadge kind="simulated" />}
        </div>
        <p className="mt-2 text-4xl font-bold tabular-nums text-text">
          {stock} eggs
        </p>
        <p className="mt-1 text-sm text-muted">
          {value !== null
            ? `Worth ${formatNaira(value)} at today's tray price.`
            : "The tray price is unavailable, so the stock value is not shown."}
        </p>
        <p className="mt-2 text-sm text-muted">
          Stock = eggs laid − eggs sold, for this flock.
        </p>
      </section>

      <SellEggsForm
        flockId={flock.id}
        stock={stock}
        trayPriceKobo={eggPrice.priceKobo}
      />

      {recentSales.length > 0 && (
        <section
          className="rounded-card border border-border bg-surface p-6 shadow-card"
          aria-labelledby="recent-sales"
        >
          <h2 id="recent-sales" className="text-lg font-semibold text-text">
            Recent sales
          </h2>
          <ul className="mt-3 divide-y divide-border">
            {recentSales.map((sale) => (
              <li
                key={sale.id}
                className="flex items-baseline justify-between gap-3 py-3 text-base"
              >
                <span className="text-text">
                  {formatDayShort(sale.date)} · {sale.eggs} eggs
                </span>
                <span className="tabular-nums text-muted">
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
