"use client";

// Sell eggs (docs/03-hencount.md page 6): eggs sold, price per tray
// prefilled from the market, trays and total shown before saving. A sale
// larger than the stock is refused on the server with one sentence.
import { AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useFormState } from "react-dom";
import { sellEggsAction, type SaleState } from "@/app/actions/eggs";
import { EGGS } from "@/lib/config";
import { formatNaira } from "@/lib/dates";

const INITIAL: SaleState = { error: null, saved: false, message: null };

const inputClass =
  "mt-1 h-12 w-full rounded-input border border-border bg-surface px-3 text-base tabular-nums text-text";

/** "4.2" for 126 eggs — one decimal is enough to read at a glance. */
function formatTrays(eggs: number): string {
  const trays = eggs / EGGS.perTray;
  return Number.isInteger(trays) ? String(trays) : trays.toFixed(1);
}

export function SellEggsForm({
  flockId,
  stock,
  trayPriceKobo,
}: {
  flockId: string;
  stock: number;
  trayPriceKobo: number | null;
}) {
  const [state, formAction] = useFormState(sellEggsAction, INITIAL);
  const [eggs, setEggs] = useState("");
  const [priceNaira, setPriceNaira] = useState(
    trayPriceKobo === null ? "" : String(Math.round(trayPriceKobo / 100)),
  );

  const eggsSold = Number(eggs) || 0;
  const price = Number(priceNaira) || 0;
  const totalKobo = Math.round((eggsSold / EGGS.perTray) * price * 100);

  if (state.saved) {
    return (
      <div className="mt-6 rounded-card border border-border bg-surface p-6 shadow-card">
        <p
          role="status"
          className="inline-flex items-center gap-2 text-lg font-semibold text-success"
        >
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          {state.message}
        </p>
        <p className="mt-2 text-base leading-6 text-muted">
          The stock below is lower by what you just sold.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/eggs"
            className="inline-flex h-12 items-center rounded-input bg-accent px-4 text-base font-semibold text-white"
          >
            Back to flocks
          </Link>
          <Link
            href={`/eggs/${flockId}/advice`}
            className="inline-flex h-12 items-center rounded-input border border-border bg-surface px-4 text-base font-semibold text-text hover:bg-bg"
          >
            See advice
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="mt-6 max-w-[560px] rounded-card border border-border bg-surface p-6 shadow-card"
    >
      <input type="hidden" name="flockId" value={flockId} />

      <div>
        <label htmlFor="sale-eggs" className="block text-sm font-medium text-text">
          Eggs sold
        </label>
        <input
          id="sale-eggs"
          name="eggs"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          value={eggs}
          onChange={(event) => setEggs(event.target.value)}
          placeholder="90"
          className={inputClass}
        />
        <p className="mt-1 text-sm text-muted">
          {stock} eggs in stock for this flock.
        </p>
      </div>

      <div className="mt-4">
        <label
          htmlFor="sale-price"
          className="block text-sm font-medium text-text"
        >
          Price per tray (₦)
        </label>
        <input
          id="sale-price"
          name="pricePerTrayNaira"
          type="number"
          inputMode="decimal"
          min={1}
          step={1}
          value={priceNaira}
          onChange={(event) => setPriceNaira(event.target.value)}
          className={inputClass}
        />
        <p className="mt-1 text-sm text-muted">
          Prefilled from today&apos;s market price. Change it if you got a
          different price.
        </p>
      </div>

      <p className="mt-4 rounded-input bg-bg px-3 py-2 text-base text-text">
        {eggsSold} eggs = <strong className="tabular-nums">{formatTrays(eggsSold)}</strong>{" "}
        trays · total{" "}
        <strong className="tabular-nums">{formatNaira(totalKobo)}</strong>
      </p>

      {state.error && (
        <p
          role="alert"
          className="mt-4 inline-flex items-start gap-2 rounded-input bg-danger-bg px-3 py-2 text-sm font-medium text-danger"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {state.error}
        </p>
      )}

      <button
        type="submit"
        className="mt-6 h-12 w-full rounded-input bg-accent px-4 text-base font-semibold text-white sm:w-auto sm:px-6"
      >
        Save sale
      </button>
    </form>
  );
}
