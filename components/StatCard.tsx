// Stat card (docs/design.md §2): label row, the 40px display-stat number,
// then a caption. DESIGN.md "Cards": the metric is isolated from surrounding
// text so it can be read at a glance in a barn.
import { card, StatLabel, StatNote, StatValue } from "./ui";

export function StatCard({
  label,
  value,
  note,
  tone = "default",
  badge,
}: {
  label: string;
  value: React.ReactNode;
  note?: React.ReactNode;
  tone?: "default" | "danger" | "success";
  badge?: React.ReactNode;
}) {
  return (
    <section className={card} aria-label={label}>
      <StatLabel trailing={badge}>{label}</StatLabel>
      <StatValue tone={tone}>{value}</StatValue>
      {note && <StatNote>{note}</StatNote>}
    </section>
  );
}
