// Shared visual primitives for the Stitch restyle.
//
// clarity_calm_agricultural_standard/DESIGN.md is authoritative. Every screen
// imports these instead of re-typing class strings, so heights, radii, borders
// and the focus ring cannot drift between routes. The sizes are the design
// system's, not taste:
//   primary button 56px · secondary/danger button 52px · input 54px
//   card 12px radius, 1px #E4E7EC, 24px padding, Level 1 shadow
//   minimum text 16px — no text-xs anywhere in the app.
//
// The focus ring itself lives in app/globals.css (3px accent, 2px white gap)
// so it applies to every interactive element without repeating a class.

/** Level 1 elevation: every data card and work surface. */
export const card =
  "rounded-card border border-border bg-surface p-space-lg shadow-card";

/** Level 2 elevation: dialogs and floating strips. */
export const elevatedCard =
  "rounded-card border border-border-strong bg-surface p-space-lg shadow-elevated";

/**
 * Primary action. Solid ochre, 56px, white 18px bold text, 24px icon on the
 * left. DESIGN.md: always pair a stroke icon with plain action text.
 */
export const btnPrimary =
  "inline-flex h-14 items-center justify-center gap-space-sm rounded-card bg-accent px-space-lg text-label-lg text-white transition-colors hover:bg-accent-dark active:brightness-95";

/**
 * Secondary action. White, 2px #D0D5DD border, #101828 text, 52px.
 * Use when the action must not dominate the screen.
 */
export const btnSecondary =
  "inline-flex h-[52px] items-center justify-center gap-space-sm rounded-card border-2 border-border-strong bg-surface px-space-lg text-label-lg text-text transition-colors hover:bg-bg";

/** Destructive action — same geometry as secondary, danger colour. */
export const btnDanger =
  "inline-flex h-[52px] items-center justify-center gap-space-sm rounded-card border-2 border-border-strong bg-surface px-space-lg text-label-lg text-danger transition-colors hover:bg-danger-bg";

/** Solid danger, for the confirm step of a delete. */
export const btnDangerSolid =
  "inline-flex h-[52px] items-center justify-center gap-space-sm rounded-card bg-danger px-space-lg text-label-lg text-white transition-colors hover:brightness-95";

/** Low-emphasis text action (links styled as buttons, card actions). */
export const btnQuiet =
  "inline-flex h-[52px] items-center justify-center gap-space-sm rounded-card border border-border bg-surface px-space-md text-body-base font-semibold text-text transition-colors hover:bg-bg";

/**
 * Text/number input. 54px, 2px #D0D5DD border, white, 18px text.
 * Labels are always rendered above the field — never placeholder-only.
 */
export const input =
  "w-full h-[54px] rounded-input border-2 border-border-strong bg-surface px-4 text-body-lg text-text placeholder:text-muted focus:border-accent focus:bg-white";

/** Permanent field label. 18px semibold with a leading icon slot. */
export const fieldLabel =
  "flex items-center gap-space-sm text-label-lg text-text";

/** Supporting helper text under a field. Never below 16px. */
export const helper = "mt-1 text-body-base leading-6 text-muted";

/** One-sentence alert, tinted, icon + word. Role is set by the caller. */
export const alertTone = {
  danger: "rounded-input border-2 border-[#FECDCA] bg-danger-bg p-space-md text-body-base font-semibold text-danger",
  success:
    "rounded-input border border-success/25 bg-success-bg p-space-md text-body-base font-semibold text-success",
  warning:
    "rounded-card bg-warning-bg p-space-md text-body-base text-warning",
  info: "rounded-input border border-info/25 bg-info-bg p-space-md text-body-base text-info",
} as const;

/**
 * Metric card body: label row (with trailing icon or badge), the 40px number,
 * then a caption. DESIGN.md "Cards".
 */
export function StatValue({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "danger" | "success";
}) {
  const toneClass =
    tone === "danger"
      ? "text-danger"
      : tone === "success"
        ? "text-success"
        : "text-text";
  return (
    <p className={`mt-space-sm text-display-stat tabular-nums ${toneClass}`}>
      {children}
    </p>
  );
}

/** Small label row at the top of a metric card, with an optional trailing slot. */
export function StatLabel({
  children,
  trailing,
}: {
  children: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-space-sm">
      <span className="text-label-base text-muted">{children}</span>
      {trailing}
    </div>
  );
}

/** Caption under a metric. */
export function StatNote({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-body-base leading-6 text-muted">{children}</p>;
}
