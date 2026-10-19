// Write operations for flocks, day logs and egg sales.
//
// Every one of them starts with the same ownership check (00-global.md §3:
// "a farmer sees only their farm") and refuses before a single row is
// touched. The database is injected so the rule and the upsert shape can be
// unit-tested without a live Postgres.
import type { OwnedFlock } from "./data";
import { NotAuthorizedError } from "./data";
import { dateKey } from "./dates";
import {
  stockEggs,
  validateDayLog,
  validateEggSale,
} from "./eggs";

/** A rule was broken; the message is the one sentence the form shows. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/** The narrow slice of PrismaClient these writes need. */
export interface WriteDb {
  flock: {
    findFirst(args: Record<string, unknown>): Promise<OwnedFlock | null>;
    update(args: Record<string, unknown>): Promise<unknown>;
    delete(args: Record<string, unknown>): Promise<unknown>;
  };
  dayLog: {
    findUnique(args: Record<string, unknown>): Promise<{ id: string } | null>;
    upsert(args: Record<string, unknown>): Promise<unknown>;
  };
  eggSale: {
    create(args: Record<string, unknown>): Promise<unknown>;
  };
}

/** The flock, but only when its farm belongs to this user. */
export async function requireOwnedFlock(
  db: WriteDb,
  flockId: string,
  userId: string,
): Promise<OwnedFlock> {
  const flock = await db.flock.findFirst({
    where: { id: flockId },
    // The rows are needed for the stock sum in sellEggsForUser, so they come
    // back with the same query as the ownership check.
    include: {
      farm: { select: { userId: true } },
      logs: true,
      sales: true,
    },
  });
  if (!flock) throw new Error("Flock not found.");
  if (flock.farm.userId !== userId) throw new NotAuthorizedError();
  return flock;
}

export interface DayLogWrite {
  userId: string;
  flockId: string;
  /** UTC-midnight Date for a @db.Date column. */
  date: Date;
  hens: number;
  eggs: number;
  feedKg: number;
}

/**
 * Save one flock's day. The unique (flockId, date) key means saving the same
 * day again overwrites it — that is what makes "Updated today's log." true.
 */
export async function saveDayLogForUser(
  db: WriteDb,
  input: DayLogWrite,
): Promise<{ updated: boolean }> {
  const checked = validateDayLog({
    date: dateKey(input.date),
    hens: input.hens,
    eggs: input.eggs,
    feedKg: input.feedKg,
  });
  if (!checked.ok) throw new ValidationError(checked.message);

  await requireOwnedFlock(db, input.flockId, input.userId);

  const existing = await db.dayLog.findUnique({
    where: { flockId_date: { flockId: input.flockId, date: input.date } },
  });

  await db.dayLog.upsert({
    where: { flockId_date: { flockId: input.flockId, date: input.date } },
    update: { hens: input.hens, eggs: input.eggs, feedKg: input.feedKg },
    create: {
      flockId: input.flockId,
      date: input.date,
      hens: input.hens,
      eggs: input.eggs,
      feedKg: input.feedKg,
    },
  });

  return { updated: existing !== null };
}

export async function renameFlockForUser(
  db: WriteDb,
  input: { userId: string; flockId: string; name: string },
): Promise<void> {
  const name = input.name.trim();
  if (!name) throw new ValidationError("Enter a flock name.");
  await requireOwnedFlock(db, input.flockId, input.userId);
  await db.flock.update({ where: { id: input.flockId }, data: { name } });
}

/** Deleting a flock deletes its logs and sales (onDelete: Cascade). */
export async function deleteFlockForUser(
  db: WriteDb,
  input: { userId: string; flockId: string },
): Promise<void> {
  await requireOwnedFlock(db, input.flockId, input.userId);
  await db.flock.delete({ where: { id: input.flockId } });
}

export interface EggSaleWrite {
  userId: string;
  flockId: string;
  date: Date;
  eggs: number;
  pricePerTrayKobo: number;
}

/** Stock is read inside the same call that writes, so it cannot go stale. */
export async function sellEggsForUser(
  db: WriteDb,
  input: EggSaleWrite,
): Promise<void> {
  const flock = await requireOwnedFlock(db, input.flockId, input.userId);

  const laid = flock.logs.reduce((sum, log) => sum + log.eggs, 0);
  const sold = flock.sales.reduce((sum, sale) => sum + sale.eggs, 0);
  const stock = stockEggs(laid, sold);

  const checked = validateEggSale(
    { eggs: input.eggs, pricePerTrayKobo: input.pricePerTrayKobo },
    stock,
  );
  if (!checked.ok) throw new ValidationError(checked.message);

  await db.eggSale.create({
    data: {
      flockId: input.flockId,
      date: input.date,
      eggs: input.eggs,
      pricePerTrayKobo: input.pricePerTrayKobo,
    },
  });
}
