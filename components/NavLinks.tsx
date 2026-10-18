"use client";

// Sidebar and bottom navigation (design.md §3: desktop left sidebar 240 px,
// phone bottom nav with 4 items). Active item = accent + word, never color
// alone; aria-current marks it for screen readers.
import {
  CloudSun,
  Egg,
  LayoutDashboard,
  Settings,
  Store,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/eggs", label: "Eggs", Icon: Egg },
  { href: "/market", label: "Market", Icon: Store },
  { href: "/weather", label: "Weather", Icon: CloudSun },
  { href: "/settings", label: "Settings", Icon: Settings },
];

/** The phone bottom bar shows 4 items; Settings stays in the top bar. */
const BOTTOM_ITEMS = ITEMS.slice(0, 4);

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function NavLinks({ variant }: { variant: "sidebar" | "bottom" }) {
  const pathname = usePathname();
  const items = variant === "sidebar" ? ITEMS : BOTTOM_ITEMS;

  if (variant === "sidebar") {
    return (
      <ul className="space-y-1">
        {items.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex h-12 w-full items-center gap-3 rounded-input px-3 text-base font-medium ${
                  active
                    ? "bg-accent/10 text-accent"
                    : "text-muted hover:bg-bg hover:text-text"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul className="grid grid-cols-4">
      {items.map(({ href, label, Icon }) => {
        const active = isActive(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium ${
                active ? "text-accent" : "text-muted"
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
