// Stat card (design.md §2): label, big number, small note. Numbers are
// tabular so columns line up.
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
  const valueTone =
    tone === "danger" ? "text-danger" : tone === "success" ? "text-success" : "text-text";
  return (
    <section
      className="rounded-card border border-border bg-surface p-6 shadow-card"
      aria-label={label}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-medium text-muted">{label}</h2>
        {badge}
      </div>
      <p className={`mt-2 text-4xl font-bold tabular-nums ${valueTone}`}>
        {value}
      </p>
      {note && <p className="mt-1 text-sm leading-6 text-muted">{note}</p>}
    </section>
  );
}
