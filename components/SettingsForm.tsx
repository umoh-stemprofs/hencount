"use client";

// Farm settings form (design.md S-FARM). Feed price is entered in naira;
// the server action stores integer kobo (00-global.md §2).
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useFormState } from "react-dom";
import { saveFarmAction } from "@/app/actions/farm";
import { LocationButton } from "@/components/LocationButton";

const inputClass =
  "mt-1 h-12 w-full rounded-input border border-border bg-surface px-3 text-base text-text placeholder:text-muted";

export interface FarmFormInitial {
  name: string;
  lat: number;
  lon: number;
  /** Naira per kg, or "" when the farm has no feed price yet. */
  feedPriceNaira: number | "";
}

export function SettingsForm({ initial }: { initial: FarmFormInitial }) {
  const [state, formAction] = useFormState(saveFarmAction, {
    error: null,
    saved: false,
  });

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <label htmlFor="farm-name" className="block text-sm font-medium text-text">
          Farm name
        </label>
        <input
          id="farm-name"
          name="name"
          type="text"
          required
          defaultValue={initial.name}
          placeholder="My farm"
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="farm-lat" className="block text-sm font-medium text-text">
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
            className={`${inputClass} tabular-nums`}
          />
          <p className="mt-1 text-sm text-muted">Between -90 and 90.</p>
        </div>
        <div>
          <label htmlFor="farm-lon" className="block text-sm font-medium text-text">
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
            className={`${inputClass} tabular-nums`}
          />
          <p className="mt-1 text-sm text-muted">Between -180 and 180.</p>
        </div>
      </div>

      <LocationButton />

      <div>
        <label
          htmlFor="feed-price"
          className="block text-sm font-medium text-text"
        >
          Feed price per kg (₦)
        </label>
        <input
          id="feed-price"
          name="feedPriceNaira"
          type="number"
          step="0.01"
          min="0.01"
          required
          defaultValue={initial.feedPriceNaira}
          placeholder="1100"
          className={`${inputClass} tabular-nums`}
        />
        <p className="mt-1 text-sm text-muted">
          In naira. Used to calculate feed cost and profit.
        </p>
      </div>

      {state.error && (
        <p
          role="alert"
          className="inline-flex items-start gap-2 rounded-input bg-danger-bg px-3 py-2 text-sm font-medium text-danger"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {state.error}
        </p>
      )}
      {state.saved && (
        <p
          role="status"
          className="inline-flex items-center gap-2 rounded-input bg-success-bg px-3 py-2 text-sm font-medium text-success"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Saved.
        </p>
      )}

      <button
        type="submit"
        className="h-12 w-full rounded-input bg-accent px-4 text-base font-semibold text-white sm:w-auto sm:px-6"
      >
        Save settings
      </button>
    </form>
  );
}
