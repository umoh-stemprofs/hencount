// Data-source badge (docs/design.md §2) — required by the Agriculture rules:
// every data block says Live, Saved data or Simulated. Colour is never alone:
// always icon + word. DESIGN.md sets a 16px floor, so the label is
// label-base (16/600), and each pill carries a 1px border in its own colour
// family for edge contrast.
import { Clock3, FlaskConical, Radio } from "lucide-react";

export type BadgeKind = "live" | "saved" | "simulated";

const STYLES: Record<
  BadgeKind,
  { label: string; className: string; Icon: typeof Radio }
> = {
  live: {
    label: "Live",
    className: "bg-success-bg text-success border-success/30",
    Icon: Radio,
  },
  saved: {
    label: "Saved data",
    className: "bg-warning-bg text-warning border-warning/30",
    Icon: Clock3,
  },
  simulated: {
    label: "Simulated",
    className: "bg-info-bg text-info border-info/30",
    Icon: FlaskConical,
  },
};

export function DataSourceBadge({
  kind,
  detail,
}: {
  kind: BadgeKind;
  detail?: string;
}) {
  const { label, className, Icon } = STYLES[kind];
  const text = detail ? `${label} · ${detail}` : label;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-label-base ${className}`}
      aria-label={`Data source: ${text}`}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      {text}
    </span>
  );
}
