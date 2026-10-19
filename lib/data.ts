// Ownership-checked reads (00-global.md §3: "every server action re-checks
// the session and ownership — a farmer sees only their farm"). Every read
// takes the session's userId; a farm row is only ever returned to its owner.
// The database is injectable so the ownership rule is unit-testable without
// a live Postgres.
import "server-only";
import { db } from "./db";

export class NotAuthorizedError extends Error {
  constructor(message = "This farm does not belong to you.") {
    super(message);
    this.name = "NotAuthorizedError";
  }
}

export interface FarmRow {
  id: string;
  userId: string;
  name: string;
  lat: number;
  lon: number;
  currency: string;
}

export interface DayLogRow {
  date: Date;
  hens: number;
  eggs: number;
  feedKg: number;
}

export interface EggSaleRow {
  eggs: number;
}

export interface FlockWithRows {
  id: string;
  name: string;
  logs: DayLogRow[];
  sales: EggSaleRow[];
}

export interface EggSaleFullRow {
  id: string;
  date: Date;
  eggs: number;
  pricePerTrayKobo: number;
}

/** One flock plus the two facts the ownership check needs. */
export interface OwnedFlock extends FlockWithRows {
  farmId: string;
  farm: { userId: string };
  sales: EggSaleFullRow[];
}

/** The narrow slice of PrismaClient these reads need (see defaultDb below). */
export interface DataDb {
  farm: {
    findFirst(args: Record<string, unknown>): Promise<FarmRow | null>;
  };
  flock: {
    findMany(args: Record<string, unknown>): Promise<FlockWithRows[]>;
    findFirst(args: Record<string, unknown>): Promise<OwnedFlock | null>;
  };
}

// Prisma's typed delegates are richer than this narrow interface; the cast
// sits at exactly one adapter boundary and the ownership logic stays plain.
const defaultDb = db as unknown as DataDb;

/** The caller's own farm, or null when they have none yet. */
export async function getFarmForUser(
  userId: string,
  database: DataDb = defaultDb,
): Promise<FarmRow | null> {
  return database.farm.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

/** The farm row, but only for its owner. Throws NotAuthorizedError otherwise. */
export async function requireFarmForUser(
  farmId: string,
  userId: string,
  database: DataDb = defaultDb,
): Promise<FarmRow> {
  const farm = await database.farm.findFirst({ where: { id: farmId } });
  if (!farm) throw new Error("Farm not found.");
  if (farm.userId !== userId) throw new NotAuthorizedError();
  return farm;
}

/**
 * One flock, but only for the farmer who owns its farm. Every egg action
 * goes through this before touching a log or a sale (00-global.md §3).
 */
export async function getFlockForUser(
  flockId: string,
  userId: string,
  database: DataDb = defaultDb,
): Promise<OwnedFlock> {
  const flock = await database.flock.findFirst({
    where: { id: flockId },
    include: {
      farm: { select: { userId: true } },
      logs: { orderBy: { date: "asc" } },
      sales: { orderBy: { date: "asc" } },
    },
  });
  if (!flock) throw new Error("Flock not found.");
  if (flock.farm.userId !== userId) throw new NotAuthorizedError();
  return flock;
}

/** All flocks (with logs, oldest first, and sales) of ONE owned farm. */
export async function getFlocksForFarm(
  farmId: string,
  userId: string,
  database: DataDb = defaultDb,
): Promise<FlockWithRows[]> {
  await requireFarmForUser(farmId, userId, database);
  return database.flock.findMany({
    where: { farmId },
    orderBy: { name: "asc" },
    include: {
      logs: { orderBy: { date: "asc" } },
      sales: { select: { eggs: true } },
    },
  });
}
