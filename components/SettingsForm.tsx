"use client";

// Farm settings form (docs/design.md S-FARM), sectioned the way the mockup
// does it: "My farm" then "Feed price". The feed price is a stepper with
// 56x56 tap targets (DESIGN.md "Large Numeric Steppers") so it can be nudged
// in the barn without typing; the field is still a real number input, and
// typing always works.
//
// Feed price is entered in naira; the server action stores integer kobo
// (00-global.md §2).
import { AlertCircle, CheckCircle2, Minus, Plus } from "lucide-react";
import { useFormState } from "react-dom";
import { saveFarmAction } from "@/app/actions/farm";
import { LocationButton } from "@/components/LocationButton";
import {
  alertTone,
  btnPrimary,
  card,
  fieldLabel,
  helper,
  input,
} from "@/components/ui";

export interface FarmFormInitial {
  name: string;
  lat: number;
  lon: number;
  /** Naira per kg, or "" when the farm has no feed price yet. */
  feedPriceNaira: number | "";
}

const stepperBtn =
  "inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-card border-2 border-border-strong bg-surface text-text transition-colors hover:bg-bg active:brightness-95";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={card} aria-labelledby={id}>
      <h2 id={id} className="text-headline-sm text-text">
        {title}
      </h2>
      <div className="mt-space-lg">{children}</div>
    </section>
  );
}

export function SettingsForm({ initial }: { initial: FarmFormInitial }) {
  const [state, formAction] = useFormState(saveFarmAction, {
    error: null,
    saved: false,
  });

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-space-lg">
      <Section id="my-farm" title="My farm">
        <div className="space-y-space-md">
          <div>
            <label htmlFor="farm-name" className={fieldLabel}>
              Farm name
            </label>
            <input
              id="farm-name"
              name="name"
              type="text"
              required
              defaultValue={initial.name}
              placeholder="My farm"
              className={`${input} mt-1`}
            />
          </div>

          <div className="grid gap-space-md sm:grid-cols-2">
            <div>
              <label htmlFor="farm-lat" className={fieldLabel}>
                Latitude
              </label>
              <input
                id="farm-lat"
                name="lat"
                type="number"
                step="0.0001"
                min={-90}
                max={90}
                required
                defaultValue={initial.lat}
                className={`${input} mt-1 tabular-nums`}
              />
              <p className={helper}>Between -90 and 90.</p>
            </div>
            <div>
              <label htmlFor="farm-lon" className={fieldLabel}>
                Longitude
              </label>
              <input
                id="farm-lon"
                name="lon"
                type="number"
                step="0.0001"
                min={-180}
                max={180}
                required
                defaultValue={initial.lon}
                className={`${input} mt-1 tabular-nums`}
              />
              <p className={helper}>Between -180 and 180.</p>
            </div>
          </div>

          <LocationButton />
        </div>
      </Section>

      <Section id="feed-price" title="Feed price">
        <div className="space-y-space-md">
          <div>
            <label htmlFor="feed-price" className={fieldLabel}>
              Feed price per kg (₦)
            </label>

            {/* DESIGN.md: big physical +/- flanking a 40px number, with real
                aria-labels naming the amount each tap moves. */}
            <div className="mt-2 flex items-center gap-space-sm">
              <button
                type="button"
                aria-label="Decrease feed price by 10 Naira"
                onClick={() => {
                  const el = document.getElementById(
                    "feed-price",
                  ) as HTMLInputElement | null;
                  if (!el) return;
                  const current = Number(el.value || 0);
                  el.value = String(Math.max(1, Math.round(current - 10)));
                  el.dispatchEvent(new Event("input", { bubbles: true }));
                }}
                className={stepperBtn}
              >
                <Minus className="h-6 w-6" aria-hidden="true" />
              </button>

              <input
                id="feed-price"
                name="feedPriceNaira"
                type="number"
                step="0.01"
                min="0.01"
                required
                defaultValue={initial.feedPriceNaira}
                placeholder="1100"
                className={`${input} h-16 flex-1 text-center text-display-stat`}
              />

              <button
                type="button"
                aria-label="Increase feed price by 10 Naira"
                onClick={() => {
                  const el = document.getElementById(
                    "feed-price",
                  ) as HTMLInputElement | null;
                  if (!el) return;
                  const current = Number(el.value || 0);
                  el.value = String(Math.round(current + 10));
                  el.dispatchEvent(new Event("input", { bubbles: true }));
                }}
                className={stepperBtn}
              >
                <Plus className="h-6 w-6" aria-hidden="true" />
              </button>
              <span className="text-body-lg-bold text-muted">₦ / kg</span>
            </div>

            <p className={helper}>
              In naira. Used to calculate feed cost and profit.
            </p>
          </div>
        </div>
      </Section>

      {state.error && (
        <p role="alert" className={alertTone.danger}>
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          {state.error}
        </p>
      )}
      {state.saved && (
        <p role="status" className={alertTone.success}>
          <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
          Saved.
        </p>
      )}

      <div>
        <button type="submit" className={btnPrimary}>
          Save settings
        </button>
      </div>
    </form>
  );
}
