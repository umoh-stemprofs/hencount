// The authenticated app shell (docs/design.md §3, Agriculture web dashboard).
// Matches stitch_.../hencount_home_desktop: a fixed 288px sidebar with an
// ochre egg tile, a solid ochre active pill, a "Barn Online" status row and
// the decision-support line; a blurred top bar; content capped at 1200px
// (DESIGN.md "Layout & Spacing"). Phone: sticky top bar + fixed 4-item bottom
// nav with 16px labels.
import { Egg, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { NavLinks } from "@/components/NavLinks";
import { requireUser } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-bg">
      {/* Desktop: fixed left sidebar, 288px */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 flex-col justify-between border-r border-border bg-surface shadow-bar lg:flex">
        <div className="flex flex-col">
          <div className="flex h-20 items-center gap-space-sm px-space-lg">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent">
              <Egg className="h-6 w-6 text-white" aria-hidden="true" />
            </span>
            <span className="text-headline-md tracking-tight text-text">
              HenCount
            </span>
          </div>
          <nav className="px-space-md py-space-sm" aria-label="Main">
            <NavLinks variant="sidebar" />
          </nav>
        </div>

        <div className="flex flex-col gap-space-sm border-t border-border p-space-md">
          <div className="flex items-center gap-space-sm rounded-xl bg-[#F1F3FF] px-space-md py-space-sm">
            <span
              className="h-3 w-3 shrink-0 rounded-full bg-success"
              aria-hidden="true"
            />
            <span className="text-label-base text-text">Barn Online</span>
          </div>

          <div className="px-space-xs">
            <p className="truncate text-body-base font-semibold text-text">
              {user.name}
            </p>
            <p className="truncate text-body-base text-muted">{user.email}</p>
            <form action={logoutAction} className="mt-space-sm">
              <button
                type="submit"
                className="inline-flex h-[52px] w-full items-center justify-center gap-space-sm rounded-card border border-border bg-surface px-space-md text-body-base font-semibold text-text transition-colors hover:bg-bg"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
                Log out
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        {/* Phone: sticky top bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-surface/90 px-space-md backdrop-blur-xl lg:fixed lg:right-0 lg:left-72 lg:h-20 lg:px-gutter-desktop shadow-bar">
          <div className="flex items-center gap-space-sm lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
              <Egg className="h-5 w-5 text-white" aria-hidden="true" />
            </span>
            <span className="text-headline-sm tracking-tight text-text">
              HenCount
            </span>
          </div>
          <div className="hidden lg:block" aria-hidden="true" />
          <div className="flex items-center gap-space-sm">
            <Link
              href="/settings"
              aria-label="Settings"
              className="inline-flex h-12 w-12 items-center justify-center rounded-card text-muted transition-colors hover:bg-bg hover:text-text lg:hidden"
            >
              <Settings className="h-5 w-5" aria-hidden="true" />
            </Link>
            <form action={logoutAction} className="lg:hidden">
              <button
                type="submit"
                aria-label="Log out"
                className="inline-flex h-12 w-12 items-center justify-center rounded-card text-muted transition-colors hover:bg-bg hover:text-text"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
              </button>
            </form>
            <span className="hidden h-8 w-8 items-center justify-center rounded-full bg-accent lg:flex">
              <span className="sr-only">Signed in as {user.name}</span>
              <span className="text-label-base text-white" aria-hidden="true">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </span>
          </div>
        </header>

        {/* pt matches the fixed 20-bar (h-20) so the greeting never tucks
            under it; the 40px below the bar is the mockup's space-xl. */}
        <main className="w-full max-w-[1200px] px-space-md pb-28 pt-space-lg sm:px-6 lg:px-8 lg:pt-[6.5rem] lg:pb-space-xl">
          {children}

          {/* Footer (00-global.md §6) — the mockups show only the first
              sentence; the second is a required disclaimer too, so both stay. */}
          <footer className="mt-space-xl max-w-[70ch] border-t border-border pt-space-md text-body-base leading-6 text-muted">
            <p className="font-semibold text-text">
              Decision-support tool. You decide.
            </p>
            <p className="mt-1">
              Prices are a simulated live feed (deterministic sample data).
              Sample thresholds and prices are placeholders — an expert must
              review them before real use.
            </p>
          </footer>
        </main>
      </div>

      {/* Phone: bottom nav, 4 items, 16px labels */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface shadow-bar lg:hidden"
      >
        <NavLinks variant="bottom" />
      </nav>
    </div>
  );
}
