// Login page (design.md S-LOGIN-W). The "Try demo account" button only
// exists when DEMO_MODE=true (00-global.md §4).
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { demoLoginAction } from "@/app/actions/auth";
import { LoginForm } from "@/components/LoginForm";
import { AUTH_ERRORS } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DEMO_ERROR_SENTENCES: Record<string, string> = {
  "demo-off": AUTH_ERRORS.demoOff,
  "demo-missing": AUTH_ERRORS.demoMissing,
  unexpected: AUTH_ERRORS.unexpected,
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const demoOn = process.env.DEMO_MODE === "true";
  const demoError = searchParams.error
    ? DEMO_ERROR_SENTENCES[searchParams.error]
    : undefined;

  return (
    <div className="w-full max-w-md rounded-card border border-border bg-surface p-6 shadow-card sm:p-8">
      <h1 className="text-2xl font-semibold text-text">Welcome back</h1>
      <p className="mt-2 max-w-[70ch] leading-6 text-muted">
        Log your eggs and feed each day, and see stock value, feed cost and
        profit for your farm.
      </p>

      <LoginForm />

      {demoOn && (
        <>
          <div className="my-5 flex items-center gap-3 text-sm text-muted">
            <span className="h-px flex-1 bg-border" aria-hidden="true" />
            or
            <span className="h-px flex-1 bg-border" aria-hidden="true" />
          </div>
          {demoError && (
            <p
              role="alert"
              className="mb-3 inline-flex items-start gap-2 rounded-input bg-danger-bg px-3 py-2 text-sm font-medium text-danger"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {demoError}
            </p>
          )}
          <form action={demoLoginAction}>
            <button
              type="submit"
              className="h-12 w-full rounded-input border border-border bg-surface px-4 text-base font-semibold text-text hover:bg-bg"
            >
              Try demo account
            </button>
          </form>
        </>
      )}

      <p className="mt-6 text-sm leading-6 text-muted">
        No account yet?{" "}
        <Link href="/signup" className="font-medium text-accent">
          Create account
        </Link>
      </p>
    </div>
  );
}
