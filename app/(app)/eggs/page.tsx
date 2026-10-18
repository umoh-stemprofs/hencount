// Placeholder until step 4B (the egg pages). Kept in the shell so the nav
// works and no screen is a dead end (design.md §6).
import Link from "next/link";

export default function EggsPage() {
  return (
    <div className="max-w-[70ch]">
      <h1 className="text-2xl font-semibold text-text">Eggs</h1>
      <p className="mt-2 leading-6 text-muted">
        The daily log, advice and egg sales arrive in the next step.
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
