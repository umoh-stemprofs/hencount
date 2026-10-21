"use client";

// Sidebar and phone bottom navigation (DESIGN.md "Layout & Spacing" +
// docs/design.md §3). Active item = solid ochre pill with white text and
// aria-current, never colour alone; the phone bottom bar carries 16px labels
// because DESIGN.md sets an absolute 16px floor on every text element.
import {
  Banknote,
  CloudSun,
  Egg,
  Home,
  Settings,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

/** The words are the mockups'. /market keeps its URL; only the label changed. */
export const ITEMS: NavItem[] = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/eggs", label: "Eggs", Icon: Egg },
  { href: "/market", label: "Prices", Icon: Banknote },
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
      <ul className="flex flex-col gap-space-xs">
        {items.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-14 items-center gap-space-sm rounded-xl px-space-md text-body-lg-bold transition-colors ${
                  active
                    ? "bg-accent text-white"
                    : "text-muted hover:bg-[#E0E8FF] hover:text-text"
                }`}
              >
                <Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                <span>{label}</span>
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
              className={`flex h-full min-h-[64px] flex-col items-center justify-center gap-1 px-1 py-2 text-body-base font-semibold transition-colors ${
                active ? "text-accent" : "text-muted"
              }`}
            >
              <Icon className="h-6 w-6" aria-hidden="true" />
              <span className="truncate">{label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
