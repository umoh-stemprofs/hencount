"use client";

// Infra failures (database unreachable, a render that timed out on a slow
// network) land here instead of Next's raw error page: one plain sentence
// and a way back — "no crashes" from design.md §6. Bad input never reaches
// this file: every form action catches its own errors and returns a
// sentence; this is the last net for the unexpected.
import { AlertTriangle } from "lucide-react";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-[70ch] rounded-card border border-border bg-surface p-6 shadow-card">
      <p
        role="alert"
        className="inline-flex items-start gap-2 text-base font-semibold text-danger"
      >
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        Something went wrong while loading this page.
      </p>
      <p className="mt-2 leading-6 text-muted">
        Check your connection and try again. Your saved logs are safe.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 inline-flex h-12 items-center rounded-input border border-border bg-surface px-4 text-base font-semibold text-text hover:bg-bg"
      >
        Try again
      </button>
    </div>
  );
}
