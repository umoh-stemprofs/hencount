"use client";

// Heat banner + its demo switch (docs/03-hencount.md heat alert; the
// threshold is 34 °C, so a cool forecast never fires it). When DEMO_MODE is
// on — and only then — a small labelled switch can preview the banner with a
// "Demo preview" pill. It renders text only: no data, no weather, nothing in
// the database changes.
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { HEAT_MESSAGE, type HeatAlert } from "@/lib/alerts";

export function HeatBanner({
  heat,
  demoMode,
}: {
  /** The real alert from the forecast, or null on a cool day. */
  heat: HeatAlert | null;
  /** process.env.DEMO_MODE === "true", read on the server and passed in. */
  demoMode: boolean;
}) {
  const [previewOn, setPreviewOn] = useState(false);

  // Real forecast wins: the genuine banner shows and no preview is needed.
  if (heat) {
    return (
      <p
        role="status"
        className="inline-flex items-start gap-2 rounded-card bg-warning-bg px-4 py-3 text-base font-medium text-warning"
      >
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <span>
          {heat.message} ({heat.date})
        </span>
      </p>
    );
  }

  if (!demoMode) return null;

  return (
    <div className="space-y-2">
      <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-muted">
        <input
          type="checkbox"
          role="switch"
          checked={previewOn}
          onChange={(event) => setPreviewOn(event.target.checked)}
          className="h-4 w-4 accent-[#9A5B00]"
        />
        Demo: show heat alert
      </label>

      {previewOn && (
        <p
          role="status"
          className="inline-flex w-full items-start gap-2 rounded-card bg-warning-bg px-4 py-3 text-base font-medium text-warning"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span>
            <span className="mr-2 rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-warning">
              Demo preview
            </span>
            {HEAT_MESSAGE}
          </span>
        </p>
      )}
    </div>
  );
}
