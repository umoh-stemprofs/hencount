"use client";

// Heat banner + its demo switch (docs/03-hencount.md heat alert; the
// threshold is 34 °C, so a cool forecast never fires it). Restructured to the
// mockup's warning card: a warm #FFFAEB panel with a circular icon holder, a
// bold headline in #7A2E0E and a plain-English detail line in #B54708.
//
// When DEMO_MODE is on — and only then — a labelled switch can preview the
// banner with a "Demo preview" pill. It renders text only: no data, no
// weather, nothing in the database changes.
import { useState } from "react";
import { Sun } from "lucide-react";
import { HEAT_MESSAGE, type HeatAlert } from "@/lib/alerts";

function Banner({
  headline,
  detail,
  preview,
}: {
  headline: string;
  detail: string;
  preview?: boolean;
}) {
  return (
    <div
      role="status"
      className="flex items-start gap-space-md rounded-card bg-[#FFFAEB] p-space-lg shadow-card"
    >
      <span
        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FEF0C7]"
        aria-hidden="true"
      >
        <Sun className="h-6 w-6 text-[#B54708]" />
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-body-lg-bold leading-7 text-[#7A2E0E]">
          {headline}
          {preview && (
            <span className="ml-2 rounded-full bg-surface px-2 py-0.5 text-label-base font-semibold text-[#B54708]">
              Demo preview
            </span>
          )}
        </p>
        <p className="text-body-base leading-6 text-[#B54708]">{detail}</p>
      </div>
    </div>
  );
}

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
      <Banner
        headline={heat.message}
        detail={`Expected to reach ${Math.round(heat.maxC)} °C on ${heat.date}. Check the drinkers now.`}
      />
    );
  }

  if (!demoMode) return null;

  return (
    <div className="space-y-2">
      {/* DESIGN.md: 28x28 hit marker with a 2px border, and the whole row is
          the target rather than just the box. */}
      <label className="inline-flex min-h-[56px] cursor-pointer items-center gap-space-sm text-body-base font-medium text-muted">
        <input
          type="checkbox"
          role="switch"
          checked={previewOn}
          onChange={(event) => setPreviewOn(event.target.checked)}
          className="h-7 w-7 shrink-0 rounded-chip border-2 border-border-strong accent-[#9A5B00]"
        />
        Demo: show heat alert
      </label>

      {previewOn && (
        <Banner
          headline={HEAT_MESSAGE}
          detail="Ambient temperature is expected to peak well above the sample threshold. Check nipple drinkers now."
          preview
        />
      )}
    </div>
  );
}
