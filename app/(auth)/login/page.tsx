// Login page, built to stitch_.../hencount_log_in_mobile: heading, plain
// purpose line, an error card that is tinted and bordered rather than a bare
// red sentence, then the two full-width secondary actions.
// The "Try demo account" button only exists when DEMO_MODE=true
// (00-global.md §4).
import Link from "next/link";
import { AlertCircle, PlayCircle, UserPlus } from "lucide-react";
import { demoLoginAction } from "@/app/actions/auth";
import { LoginForm } from "@/components/LoginForm";
import { AUTH_ERRORS } from "@/lib/auth";
import { alertTone, card } from "@/components/ui";

export const dynamic = "force-dynamic";

const DEMO_ERROR_SENTENCES: Record<string, string> = {
  "demo-off": AUTH_ERRORS.demoOff,
  "demo-missing": AUTH_ERRORS.demoMissing,
  unexpected: AUTH_ERRORS.unexpected,
};

const btnWideSecondary =
  "flex h-[52px] w-full items-center justify-center gap-space-sm rounded-card border border-border bg-surface text-label-lg text-text transition-colors hover:bg-bg";
const btnWideAccent =
  "flex h-[52px] w-full items-center justify-center gap-space-sm rounded-card border border-border bg-surface text-label-lg text-accent transition-colors hover:bg-[#FFF7ED]";

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
    <div className={`w-full max-w-md ${card} sm:p-8`}>
      <div className="flex flex-col gap-1">
        <h1 className="text-headline-md tracking-tight text-text">Log in</h1>
        <p className="text-body-lg leading-7 text-muted">
          Write down your eggs and feed. See your money.
        </p>
      </div>

      <LoginForm />

      {demoOn && (
        <div className="mt-space-lg flex flex-col gap-space-sm border-t border-border pt-space-lg">
          {demoError && (
            <p role="alert" className={alertTone.danger}>
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              {demoError}
            </p>
          )}
          <form action={demoLoginAction}>
            <button type="submit" className={btnWideAccent}>
              <PlayCircle className="h-5 w-5" aria-hidden="true" />
              Try demo account
            </button>
          </form>
        </div>
      )}

      <div className="mt-space-sm flex flex-col gap-space-sm">
        <Link href="/signup" className={btnWideSecondary}>
          <UserPlus className="h-5 w-5" aria-hidden="true" />
          Make an account
        </Link>
        <p className="text-center text-body-base leading-6 text-muted">
          No account yet?{" "}
          <Link href="/signup" className="font-semibold text-accent">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
