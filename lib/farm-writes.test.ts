// Ownership and rule tests for the egg writes (docs 4B). Every operation is
// run against a stub database, so a refusal can be checked to leave the rows
// untouched — not just to throw.
import { describe, expect, it } from "vitest";
import { NotAuthorizedError } from "./data";
import {
  ValidationError,
  deleteFlockForUser,
  renameFlockForUser,
  saveDayLogForUser,
  sellEggsForUser,
  type WriteDb,
} from "./farm-writes";

type LogRow = {
  id: string;
  flockId: string;
  date: Date;
  hens: number;
  eggs: number;
  feedKg: number;
};

type SaleRow = {
  id: string;
  flockId: string;
  date: Date;
  eggs: number;
  pricePerTrayKobo: number;
};

const DAY = new Date(Date.UTC(2026, 9, 18));
const keyOf = (flockId: string, date: Date) =>
  `${flockId}|${date.toISOString().slice(0, 10)}`;

/** A stub database that only ever holds farmer A's single flock. */
function stubDb(
  ownerUserId: string,
  seed: { logs?: LogRow[]; sales?: SaleRow[] } = {},
) {
  const logs = new Map<string, LogRow>();
  for (const row of seed.logs ?? []) logs.set(keyOf(row.flockId, row.date), row);
  const sales: SaleRow[] = [...(seed.sales ?? [])];
  const counts = { renames: 0, deletes: 0, creates: 0, upserts: 0 };

  const includes: Record<string, unknown>[] = [];

  const db: WriteDb = {
    flock: {
      findFirst: async (args) => {
        includes.push(args.include as Record<string, unknown>);
        const where = args.where as { id?: string };
        if (where.id !== "flock_a") return null;
        return {
          id: "flock_a",
          farmId: "farm_a",
          name: "Layers",
          farm: { userId: ownerUserId },
          logs: [...logs.values()],
          sales,
        };
      },
      update: async () => {
        counts.renames += 1;
      },
      delete: async () => {
        counts.deletes += 1;
      },
    },
    dayLog: {
      findUnique: async (args) => {
        const where = args.where as {
          flockId_date: { flockId: string; date: Date };
        };
        return logs.has(
          keyOf(where.flockId_date.flockId, where.flockId_date.date),
        )
          ? { id: "log_1" }
          : null;
      },
      upsert: async (args) => {
        counts.upserts += 1;
        const where = args.where as {
          flockId_date: { flockId: string; date: Date };
        };
        const created = args.create as LogRow;
        logs.set(
          keyOf(where.flockId_date.flockId, where.flockId_date.date),
          created,
        );
      },
    },
    eggSale: {
      create: async () => {
        counts.creates += 1;
      },
    },
  };

  return { db, logs, counts, includes };
}

describe("ownership — another farmer's flock is untouchable", () => {
  it("cannot save a day log, and nothing is written", async () => {
    const { db, counts } = stubDb("usr_a");
    await expect(
      saveDayLogForUser(db, {
        userId: "usr_b",
        flockId: "flock_a",
        date: DAY,
        hens: 100,
        eggs: 85,
        feedKg: 12,
      }),
    ).rejects.toBeInstanceOf(NotAuthorizedError);
    expect(counts.upserts).toBe(0);
  });

  it("cannot rename or delete a flock", async () => {
    const { db, counts } = stubDb("usr_a");
    await expect(
      renameFlockForUser(db, { userId: "usr_b", flockId: "flock_a", name: "Mine now" }),
    ).rejects.toBeInstanceOf(NotAuthorizedError);
    await expect(
      deleteFlockForUser(db, { userId: "usr_b", flockId: "flock_a" }),
    ).rejects.toBeInstanceOf(NotAuthorizedError);
    expect(counts.renames).toBe(0);
    expect(counts.deletes).toBe(0);
  });

  it("cannot sell a flock's eggs, even with stock on hand", async () => {
    const { db, counts } = stubDb("usr_a", {
      logs: [
        { id: "l1", flockId: "flock_a", date: DAY, hens: 100, eggs: 90, feedKg: 12 },
      ],
    });
    await expect(
      sellEggsForUser(db, {
        userId: "usr_b",
        flockId: "flock_a",
        date: DAY,
        eggs: 30,
        pricePerTrayKobo: 380000,
      }),
    ).rejects.toBeInstanceOf(NotAuthorizedError);
    expect(counts.creates).toBe(0);
  });

  it("the owner can do all four", async () => {
    const { db, counts } = stubDb("usr_a", {
      logs: [
        { id: "l1", flockId: "flock_a", date: DAY, hens: 100, eggs: 90, feedKg: 12 },
      ],
    });
    await saveDayLogForUser(db, {
      userId: "usr_a",
      flockId: "flock_a",
      date: DAY,
      hens: 100,
      eggs: 90,
      feedKg: 12,
    });
    await renameFlockForUser(db, {
      userId: "usr_a",
      flockId: "flock_a",
      name: "  Mango Creek  ",
    });
    await sellEggsForUser(db, {
      userId: "usr_a",
      flockId: "flock_a",
      date: DAY,
      eggs: 30,
      pricePerTrayKobo: 380000,
    });
    await deleteFlockForUser(db, { userId: "usr_a", flockId: "flock_a" });
    expect(counts).toEqual({ renames: 1, deletes: 1, creates: 1, upserts: 1 });
  });
});

describe("the ownership query", () => {
  it("brings back the logs and sales that the stock sum needs", async () => {
    // Selling reads stock from the same query as the ownership check; a
    // regression here silently turns every sale into a crash.
    const { db, includes } = stubDb("usr_a");
    await saveDayLogForUser(db, {
      userId: "usr_a",
      flockId: "flock_a",
      date: DAY,
      hens: 100,
      eggs: 85,
      feedKg: 12,
    });
    expect(Object.keys(includes[0] ?? {})).toEqual(
      expect.arrayContaining(["farm", "logs", "sales"]),
    );
  });
});

describe("saving a day log", () => {
  it("saving the same flock and day again overwrites the one row", async () => {
    const { db, logs } = stubDb("usr_a");
    const first = await saveDayLogForUser(db, {
      userId: "usr_a",
      flockId: "flock_a",
      date: DAY,
      hens: 100,
      eggs: 85,
      feedKg: 12,
    });
    const second = await saveDayLogForUser(db, {
      userId: "usr_a",
      flockId: "flock_a",
      date: DAY,
      hens: 100,
      eggs: 90,
      feedKg: 12.4,
    });

    expect(first.updated).toBe(false);
    expect(second.updated).toBe(true);
    expect(logs.size).toBe(1);
    expect([...logs.values()][0]).toMatchObject({ eggs: 90, feedKg: 12.4 });
  });

  it("refuses more eggs than hens with the exact sentence and writes nothing", async () => {
    const { db, counts } = stubDb("usr_a");
    await expect(
      saveDayLogForUser(db, {
        userId: "usr_a",
        flockId: "flock_a",
        date: DAY,
        hens: 10,
        eggs: 11,
        feedKg: 2,
      }),
    ).rejects.toThrow(new ValidationError("Eggs cannot be more than hens."));
    expect(counts.upserts).toBe(0);
  });
});

describe("selling eggs", () => {
  it("rejects a sale larger than the stock, and creates nothing", async () => {
    const { db, counts } = stubDb("usr_a", {
      logs: [
        { id: "l1", flockId: "flock_a", date: DAY, hens: 100, eggs: 100, feedKg: 12 },
      ],
      sales: [
        { id: "s1", flockId: "flock_a", date: DAY, eggs: 70, pricePerTrayKobo: 380000 },
      ],
    });
    await expect(
      sellEggsForUser(db, {
        userId: "usr_a",
        flockId: "flock_a",
        date: DAY,
        eggs: 31,
        pricePerTrayKobo: 380000,
      }),
    ).rejects.toThrow(
      new ValidationError("You cannot sell more eggs than you have in stock."),
    );
    expect(counts.creates).toBe(0);
  });

  it("accepts a sale within the stock", async () => {
    const { db, counts } = stubDb("usr_a", {
      logs: [
        { id: "l1", flockId: "flock_a", date: DAY, hens: 100, eggs: 100, feedKg: 12 },
      ],
      sales: [
        { id: "s1", flockId: "flock_a", date: DAY, eggs: 70, pricePerTrayKobo: 380000 },
      ],
    });
    await sellEggsForUser(db, {
      userId: "usr_a",
      flockId: "flock_a",
      date: DAY,
      eggs: 30,
      pricePerTrayKobo: 380000,
    });
    expect(counts.creates).toBe(1);
  });
});
