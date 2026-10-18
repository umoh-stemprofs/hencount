// Ownership tests (docs 4A, 00-global.md §3): a farmer must never be able to
// read another farmer's flock. The database is a stub, so these test the
// access rule itself without a live Postgres.
import { describe, expect, it } from "vitest";
import {
  NotAuthorizedError,
  getFarmForUser,
  getFlocksForFarm,
  requireFarmForUser,
  type DataDb,
  type FarmRow,
} from "./data";

const farmA: FarmRow = {
  id: "farm_a",
  userId: "usr_a",
  name: "Ada's farm",
  lat: 4.8,
  lon: 7,
  currency: "NGN",
};

/** A tiny database that only ever holds farmer A's farm. */
function stubDb(ownerUserId: string | null) {
  let flockQueries = 0;
  const database: DataDb = {
    farm: {
      findFirst: async (args) => {
        const where = args.where as Record<string, unknown>;
        if (where.id !== undefined) {
          return ownerUserId !== null && where.id === farmA.id ? farmA : null;
        }
        return ownerUserId !== null && where.userId === ownerUserId
          ? farmA
          : null;
      },
    },
    flock: {
      findMany: async () => {
        flockQueries += 1;
        return [{ id: "flock_1", name: "Layers", logs: [], sales: [] }];
      },
    },
  };
  return { database, flockQueries: () => flockQueries };
}

describe("ownership — a farmer sees only their farm", () => {
  it("farmer B cannot read farmer A's flocks, and the flock query never runs", async () => {
    const { database, flockQueries } = stubDb("usr_a");
    await expect(
      getFlocksForFarm("farm_a", "usr_b", database),
    ).rejects.toBeInstanceOf(NotAuthorizedError);
    expect(flockQueries()).toBe(0);
  });

  it("farmer A can read their own flocks", async () => {
    const { database, flockQueries } = stubDb("usr_a");
    const flocks = await getFlocksForFarm("farm_a", "usr_a", database);
    expect(flocks).toHaveLength(1);
    expect(flockQueries()).toBe(1);
  });

  it("getFarmForUser returns a farm only to its owner", async () => {
    const { database } = stubDb("usr_a");
    expect(await getFarmForUser("usr_a", database)).toEqual(farmA);
    expect(await getFarmForUser("usr_b", database)).toBeNull();
  });

  it("requireFarmForUser throws NotAuthorizedError for another farmer's farm", async () => {
    const { database } = stubDb("usr_a");
    await expect(
      requireFarmForUser("farm_a", "usr_b", database),
    ).rejects.toBeInstanceOf(NotAuthorizedError);
    await expect(requireFarmForUser("farm_a", "usr_a", database)).resolves.toEqual(
      farmA,
    );
  });
});
