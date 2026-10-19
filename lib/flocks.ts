// Pure flock helpers: what is in stock and whether a day is logged. No
// database, no clock — the caller passes the date it means (APP_TZ today).
import { stockEggs } from "./eggs";

export interface EggCount {
  eggs: number;
}

export function laidEggs(logs: EggCount[]): number {
  return logs.reduce((sum, log) => sum + log.eggs, 0);
}

export function soldEggs(sales: EggCount[]): number {
  return sales.reduce((sum, sale) => sum + sale.eggs, 0);
}

/** Eggs in hand for one flock: laid − sold. */
export function stockFor(logs: EggCount[], sales: EggCount[]): number {
  return stockEggs(laidEggs(logs), soldEggs(sales));
}

/** The log for one calendar day, or undefined when that day is not logged. */
export function logOnDate<T extends { date: Date }>(
  logs: T[],
  day: Date,
): T | undefined {
  const key = day.toISOString().slice(0, 10);
  return logs.find((log) => log.date.toISOString().slice(0, 10) === key);
}
