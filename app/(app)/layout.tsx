// The authenticated app shell (design.md §3, Agriculture web dashboard):
// desktop 240 px left sidebar + content grid, phone top bar + bottom nav
// with 4 items. The footer line is on every page.
import { LogOut, Settings } from "lucide-react";
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
      {/* Desktop: left sidebar, 240 px */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-border bg-surface lg:flex">
        <div className="px-6 py-6">
          <p className="text-lg font-semibold text-accent">HenCount</p>
          <p className="mt-1 text-sm text-muted">Eggs, feed and profit</p>
        </div>
        <nav className="flex-1 px-3" aria-label="Main">
          <NavLinks variant="sidebar" />
        </nav>
        <div className="border-t border-border px-6 py-4">
          <p className="truncate text-sm font-medium text-text">{user.name}</p>
          <p className="truncate text-sm text-muted">{user.email}</p>
          <form action={logoutAction} className="mt-3">
            <button
              type="submit"
              className="inline-flex h-12 items-center gap-2 rounded-input border border-border bg-surface px-3 text-sm font-semibold text-text hover:bg-bg"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Log out
            </button>
          </form>
        </div>
      </aside>

      {/* Phone: top bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-4 py-2 lg:hidden">
        <p className="text-lg font-semibold text-accent">HenCount</p>
        <div className="flex items-center gap-1">
          <Link
            href="/settings"
            aria-label="Settings"
            className="inline-flex h-12 w-12 items-center justify-center rounded-input text-muted"
          >
            <Settings className="h-5 w-5" aria-hidden="true" />
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              aria-label="Log out"
              className="inline-flex h-12 w-12 items-center justify-center rounded-input text-muted"
            >
              <LogOut className="h-5 w-5" aria-hidden="true" />
            </button>
          </form>
        </div>
      </header>

      <main className="lg:pl-60">
        <div className="mx-auto max-w-[1280px] px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8 lg:pb-10">
          {children}
          <footer className="mt-10 max-w-[70ch] border-t border-border pt-4 text-sm leading-6 text-muted">
            <p className="font-medium text-text">
              Decision-support tool. You decide.
            </p>
            <p className="mt-1">
              Prices are a simulated live feed (deterministic sample data).
              Sample thresholds and prices are placeholders — an expert must
              review them before real use.
            </p>
          </footer>
        </div>
      </main>

      {/* Phone: bottom nav, 4 items */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface lg:hidden"
      >
        <NavLinks variant="bottom" />
      </nav>
    </div>
  );
}
