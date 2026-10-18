// Data-source badge (design.md §2) — required by the Agriculture rules:
// every data block says Live, Saved data or Simulated. Colour is never
// alone: always icon + word.
import { Clock3, FlaskConical, Radio } from "lucide-react";

export type BadgeKind = "live" | "saved" | "simulated";

const STYLES: Record<BadgeKind, { label: string; className: string; Icon: typeof Radio }> = {
  live: {
    label: "Live",
    className: "bg-success-bg text-success",
    Icon: Radio,
  },
  saved: {
    label: "Saved data",
    className: "bg-warning-bg text-warning",
    Icon: Clock3,
  },
  simulated: {
    label: "Simulated",
    className: "bg-info-bg text-info",
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
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium ${className}`}
      aria-label={`Data source: ${text}`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {text}
    </span>
  );
}
