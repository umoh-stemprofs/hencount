// Minimal centered shell for login and signup, built to the mockup in
// stitch_.../hencount_log_in_mobile: a brand bar with a "Secure" chip, the
// card, then the required footer line.
import { Egg, ShieldCheck } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col justify-between bg-bg px-4 py-6">
      <header className="flex w-full items-center justify-between border-b border-border pb-4 pt-3">
        <span className="flex items-center gap-space-sm">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
            <Egg className="h-5 w-5 text-white" aria-hidden="true" />
          </span>
          <span className="text-headline-sm tracking-tight text-text">
            HenCount
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-surface px-3 py-1 text-label-base font-medium text-muted">
          <ShieldCheck className="h-5 w-5 text-success" aria-hidden="true" />
          Secure
        </span>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center py-6">
        {children}
      </div>

      <footer className="w-full border-t border-border py-4 text-center">
        <p className="inline-flex items-center gap-1.5 text-body-base font-medium text-muted">
          Decision-support tool. You decide.
        </p>
      </footer>
    </main>
  );
}
