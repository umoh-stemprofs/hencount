// Add today (docs/03-hencount.md page 3): the two-step form for one flock.
// Saving again on the same day overwrites, so the page says so when today is
// already logged.
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddTodayForm } from "@/components/AddTodayForm";
import { formatDayShort, todayInAppTz } from "@/lib/dates";
import { getFlockForUser } from "@/lib/data";
import { logOnDate } from "@/lib/flocks";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AddTodayPage({
  params,
}: {
  params: { flockId: string };
}) {
  const user = await requireUser();
  const flock = await getFlockForUser(params.flockId, user.userId).catch(
    () => null,
  );
  if (!flock) notFound();

  const today = todayInAppTz();
  const existing = logOnDate(flock.logs, today);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/eggs"
          className="inline-flex items-center gap-1 text-sm font-medium text-accent"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          All flocks
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-text">Add today</h1>
        <p className="mt-1 max-w-[70ch] leading-6 text-muted">
          {flock.name} · {formatDayShort(today)}. Two steps: the hens and eggs,
          then the feed.
        </p>
      </div>

      {existing && (
        <p className="max-w-[70ch] rounded-card border border-border bg-warning-bg px-4 py-3 text-base leading-6 text-warning">
          Today is already logged ({existing.hens} hens, {existing.eggs} eggs,{" "}
          {existing.feedKg} kg feed). Saving again replaces it.
        </p>
      )}

      <AddTodayForm
        flockId={flock.id}
        flockName={flock.name}
        initial={
          existing
            ? { hens: existing.hens, eggs: existing.eggs, feedKg: existing.feedKg }
            : null
        }
      />
    </div>
  );
}
