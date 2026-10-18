// Placeholder until step 4B (market page). Kept in the shell so the nav
// works and no screen is a dead end (design.md §6).
import Link from "next/link";

export default function MarketPage() {
  return (
    <div className="max-w-[70ch]">
      <h1 className="text-2xl font-semibold text-text">Market</h1>
      <p className="mt-2 leading-6 text-muted">
        The market page with the egg tray price arrives in the next step. The
        current tray price is already on the dashboard.
      </p>
      <Link
        href="/"
        className="mt-4 inline-flex h-12 items-center rounded-input bg-accent px-4 text-base font-semibold text-white"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
