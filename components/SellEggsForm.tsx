"use client";

// Sell eggs (docs/03-hencount.md page 6), built to
// stitch_.../hencount_sell_eggs_desktop: a tray stepper with 56x56 tap
// targets (one tap = one tray of 30), the market price prefilled, and the
// running total at display-stat so it can be read before saving.
//
// A sale larger than the stock is refused on the server with one sentence —
// the stepper does not silently clamp, because the server is the only judge
// and its sentence is the documented behaviour.
import { AlertCircle, CheckCircle2, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { sellEggsAction, type SaleState } from "@/app/actions/eggs";
import { EGGS } from "@/lib/config";
import { formatNaira } from "@/lib/dates";
import {
  alertTone,
  btnPrimary,
  btnSecondary,
  card,
  fieldLabel,
  helper,
  input,
} from "./ui";

const INITIAL: SaleState = { error: null, saved: false, message: null };

const stepperBtn =
  "inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-card border-2 border-border-strong bg-surface text-text transition-colors hover:bg-bg active:brightness-95";

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
  // A refusal stays on screen until the user edits an input — otherwise an
  // old "more than stock" message lingers after the number is corrected.
  const [edited, setEdited] = useState(false);
  useEffect(() => setEdited(false), [state]);
  const visibleError = edited ? null : state.error;

  const eggsSold = Number(eggs) || 0;
  const price = Number(priceNaira) || 0;
  const totalKobo = Math.round((eggsSold / EGGS.perTray) * price * 100);

  const bumpEggs = (by: number) => {
    setEdited(true);
    const current = Number(eggs) || 0;
    setEggs(String(Math.max(1, current + by)));
  };

  if (state.saved) {
    return (
      <div className={`${card} mt-6`}>
        <p
          role="status"
          className="inline-flex items-center gap-2 text-headline-lg text-success"
        >
          <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
          {state.message}
        </p>
        <p className="mt-2 text-body-lg leading-7 text-muted">
          The stock below is lower by what you just sold.
        </p>
        <div className="mt-space-lg flex flex-wrap gap-space-sm">
          <Link href="/eggs" className={btnPrimary}>
            Back to flocks
          </Link>
          <Link href={`/eggs/${flockId}/advice`} className={btnSecondary}>
            See advice
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className={`${card} mt-6 max-w-[560px]`}>
      <input type="hidden" name="flockId" value={flockId} />

      <div>
        <label htmlFor="sale-eggs" className={fieldLabel}>
          Eggs sold
        </label>
        <div className="mt-2 flex items-center gap-space-sm">
          <button
            type="button"
            aria-label="Decrease by one tray"
            onClick={() => bumpEggs(-EGGS.perTray)}
            className={stepperBtn}
          >
            <Minus className="h-6 w-6" aria-hidden="true" />
          </button>
          <input
            id="sale-eggs"
            name="eggs"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={eggs}
            onChange={(event) => {
              setEdited(true);
              setEggs(event.target.value);
            }}
            placeholder="90"
            className={`${input} h-16 flex-1 text-center text-display-stat`}
          />
          <button
            type="button"
            aria-label="Increase by one tray"
            onClick={() => bumpEggs(EGGS.perTray)}
            className={stepperBtn}
          >
            <Plus className="h-6 w-6" aria-hidden="true" />
          </button>
          <span className="text-body-lg-bold text-muted">eggs</span>
        </div>
        <p className={helper}>{stock} eggs in stock for this flock.</p>
      </div>

      <div className="mt-space-lg">
        <label htmlFor="sale-price" className={fieldLabel}>
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
          onChange={(event) => {
            setEdited(true);
            setPriceNaira(event.target.value);
          }}
          className={`${input} mt-1 tabular-nums`}
        />
        <p className={helper}>
          Prefilled from today&apos;s market price. Change it if you got a
          different price.
        </p>
      </div>

      {/* The mockup's running total: big, isolated, read before saving. */}
      <div className="mt-space-lg rounded-card bg-[#F1F3FF] p-space-lg">
        <p className="text-label-base text-muted">Total from this sale</p>
        <p className="text-display-stat tabular-nums tracking-tight text-text">
          {formatNaira(totalKobo)}
        </p>
        <p className="text-body-base text-muted">
          {eggsSold} eggs = <strong className="tabular-nums">{formatTrays(eggsSold)}</strong>{" "}
          trays
        </p>
      </div>

      {visibleError && (
        <p role="alert" className={`mt-space-lg ${alertTone.danger}`}>
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          {visibleError}
        </p>
      )}

      <button type="submit" className={`${btnPrimary} mt-space-lg w-full sm:w-auto`}>
        Save sale
      </button>
    </form>
  );
}
