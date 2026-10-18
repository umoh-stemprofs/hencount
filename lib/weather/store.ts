// WeatherSnapshot cache (00-global.md §3): 30 minutes of fresh data, and a
// "Saved data" fallback when the provider is unreachable.
import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "../db";
import { snapshotPayloadSchema } from "./schemas";
import type { WeatherData } from "./types";

export interface SavedSnapshot {
  payload: unknown;
  source: string;
  fetchedAt: Date;
}

export interface SnapshotStore {
  latest(farmId: string): Promise<SavedSnapshot | null>;
  save(farmId: string, data: WeatherData): Promise<void>;
}

/** Parse a stored payload; returns null when the row is unreadable. */
export function parseSnapshotPayload(snapshot: SavedSnapshot): WeatherData | null {
  const parsed = snapshotPayloadSchema.safeParse(snapshot.payload);
  if (!parsed.success) return null;
  const source =
    snapshot.source === "OPENWEATHERMAP" ? "OPENWEATHERMAP" : "OPEN_METEO";
  return {
    current: parsed.data.current,
    daily: parsed.data.daily,
    fetchedAt: snapshot.fetchedAt.toISOString(),
    source,
  };
}

export const prismaSnapshotStore: SnapshotStore = {
  async latest(farmId) {
    const row = await db.weatherSnapshot.findFirst({
      where: { farmId },
      orderBy: { fetchedAt: "desc" },
      select: { payload: true, source: true, fetchedAt: true },
    });
    return row ?? null;
  },
  async save(farmId, data) {
    await db.weatherSnapshot.create({
      data: {
        farmId,
        source: data.source,
        fetchedAt: new Date(data.fetchedAt),
        // Prisma's Json input type wants an index signature our typed object
        // has no way to declare; the shape is already validated on read.
        payload: { current: data.current, daily: data.daily } as unknown as Prisma.InputJsonValue,
      },
    });
  },
};
