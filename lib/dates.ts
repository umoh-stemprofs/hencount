// Calendar-day helpers. Every date in the app means a day in APP_TZ
// (00-global.md §2) — never the server's clock zone.

export const APP_TZ = process.env.APP_TZ || "Africa/Lagos";

/** Today's calendar day as a UTC-midnight Date (how @db.Date columns store). */
export function todayInAppTz(now: Date = new Date()): Date {
  const iso = new Intl.DateTimeFormat("en-CA", { timeZone: APP_TZ }).format(now);
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(date: Date, n: number): Date {
  return new Date(date.getTime() + n * 86_400_000);
}

/** "YYYY-MM-DD" — the app's wire format for dates. */
export function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** "Mon 20 Oct" (design.md §6). */
export function formatDayShort(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: APP_TZ,
  })
    .format(date)
    .replace(/,/g, "");
}

/** Money at the edge only: 1250000 kobo → "₦12,500" (00-global.md §2). */
export function formatNaira(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

/** "2 min ago" / "3 h old" / "just now" — for data-source badges. */
export function formatAge(minutes: number): string {
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${Math.round(minutes)} min ago`;
  const hours = minutes / 60;
  if (hours < 48) return `${Math.round(hours)} h old`;
  return `${Math.round(hours / 24)} days old`;
}
