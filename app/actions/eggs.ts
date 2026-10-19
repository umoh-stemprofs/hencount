// Egg actions: flocks, the daily log and egg sales.
//
// Every action re-checks the session, validates with Zod and then goes
// through /lib/farm-writes.ts, which refuses another farmer's flock before
// touching a row. Every save revalidates the layout so the dashboard and the
// egg pages update at once, and a database hiccup still returns one plain
// sentence instead of a crash (design.md §6).
"use server";

import { revalidatePath } from "next/cache";
import { firstIssue } from "@/lib/auth";
import { DEFAULT_FARM } from "@/lib/config";
import { NotAuthorizedError, getFarmForUser } from "@/lib/data";
import { db } from "@/lib/db";
import { todayInAppTz } from "@/lib/dates";
import {
  ValidationError,
  deleteFlockForUser,
  renameFlockForUser,
  saveDayLogForUser,
  sellEggsForUser,
  type WriteDb,
} from "@/lib/farm-writes";
import { requireUser } from "@/lib/session";
import {
  dayLogSchema,
  eggSaleSchema,
  flockSchema,
} from "@/lib/validation";

const writes = db as unknown as WriteDb;

export interface FlockFormState {
  error: string | null;
  saved: boolean;
  /** Set after a successful save so the page can confirm it. */
  message: string | null;
}

export type DayLogField = "hens" | "eggs" | "feedKg";

export interface DayLogState {
  error: string | null;
  /** Which field the sentence belongs under. */
  field: DayLogField | null;
  saved: boolean;
  /** True when today's log already existed and was overwritten. */
  updated: boolean;
  message: string | null;
}

export interface SaleState {
  error: string | null;
  saved: boolean;
  message: string | null;
}

const NOT_YOURS = "That flock is not on your farm.";
const UNREACHABLE =
  "Could not reach the database. Check your connection and try again.";

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

/**
 * Which field a refusal belongs under, for the inline sentence. Matched on
 * keywords rather than the sentence's opening word, so rewording a message
 * (e.g. "That number of hens looks too big") cannot silently un-anchor it.
 * "Eggs cannot be more than hens." names both fields — eggs wins because
 * that is where the user must act.
 */
function fieldFor(message: string): DayLogField | null {
  const text = message.toLowerCase();
  if (text.includes("egg")) return "eggs";
  if (text.includes("feed")) return "feedKg";
  if (text.includes("hen")) return "hens";
  return null;
}

/** A farm is needed before a flock exists; a new account gets a default one. */
async function ensureFarm(userId: string) {
  const existing = await getFarmForUser(userId);
  if (existing) return existing;
  return db.farm.create({
    data: {
      userId,
      name: "My farm",
      lat: DEFAULT_FARM.lat,
      lon: DEFAULT_FARM.lon,
    },
  });
}

export async function createFlockAction(
  _prev: FlockFormState,
  formData: FormData,
): Promise<FlockFormState> {
  const user = await requireUser();

  const parsed = flockSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: firstIssue(parsed.error), saved: false, message: null };
  }

  try {
    const farm = await ensureFarm(user.userId);
    await db.flock.create({
      data: { farmId: farm.id, name: parsed.data.name },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        error: "You already have a flock with that name.",
        saved: false,
        message: null,
      };
    }
    console.error("Creating a flock failed:", error);
    return { error: UNREACHABLE, saved: false, message: null };
  }

  revalidatePath("/", "layout");
  return {
    error: null,
    saved: true,
    message: `Added ${parsed.data.name}.`,
  };
}

export async function renameFlockAction(
  _prev: FlockFormState,
  formData: FormData,
): Promise<FlockFormState> {
  const user = await requireUser();
  const flockId = String(formData.get("flockId") ?? "");

  const parsed = flockSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: firstIssue(parsed.error), saved: false, message: null };
  }

  try {
    await renameFlockForUser(writes, {
      userId: user.userId,
      flockId,
      name: parsed.data.name,
    });
  } catch (error) {
    if (error instanceof NotAuthorizedError) {
      return { error: NOT_YOURS, saved: false, message: null };
    }
    if (error instanceof ValidationError) {
      return { error: error.message, saved: false, message: null };
    }
    if (isUniqueViolation(error)) {
      return {
        error: "You already have a flock with that name.",
        saved: false,
        message: null,
      };
    }
    console.error("Renaming a flock failed:", error);
    return { error: UNREACHABLE, saved: false, message: null };
  }

  revalidatePath("/", "layout");
  return { error: null, saved: true, message: "Flock renamed." };
}

export async function deleteFlockAction(
  _prev: FlockFormState,
  formData: FormData,
): Promise<FlockFormState> {
  const user = await requireUser();
  const flockId = String(formData.get("flockId") ?? "");

  try {
    await deleteFlockForUser(writes, { userId: user.userId, flockId });
  } catch (error) {
    if (error instanceof NotAuthorizedError) {
      return { error: NOT_YOURS, saved: false, message: null };
    }
    console.error("Deleting a flock failed:", error);
    return { error: UNREACHABLE, saved: false, message: null };
  }

  revalidatePath("/", "layout");
  return { error: null, saved: true, message: "Flock deleted." };
}

export async function saveDayLogAction(
  _prev: DayLogState,
  formData: FormData,
): Promise<DayLogState> {
  const user = await requireUser();

  const parsed = dayLogSchema.safeParse({
    flockId: formData.get("flockId"),
    hens: formData.get("hens"),
    eggs: formData.get("eggs"),
    feedKg: formData.get("feedKg"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      error: firstIssue(parsed.error),
      field: fieldFor(issue?.message ?? ""),
      saved: false,
      updated: false,
      message: null,
    };
  }

  let result: { updated: boolean };
  try {
    // The rule from /lib/eggs.ts ("Eggs cannot be more than hens.") is
    // enforced here, on the server, no matter what the browser sent.
    result = await saveDayLogForUser(writes, {
      userId: user.userId,
      flockId: parsed.data.flockId,
      date: todayInAppTz(),
      hens: parsed.data.hens,
      eggs: parsed.data.eggs,
      feedKg: parsed.data.feedKg,
    });
  } catch (error) {
    if (error instanceof NotAuthorizedError) {
      return { error: NOT_YOURS, field: null, saved: false, updated: false, message: null };
    }
    if (error instanceof ValidationError) {
      return {
        error: error.message,
        field: fieldFor(error.message),
        saved: false,
        updated: false,
        message: null,
      };
    }
    console.error("Saving today's log failed:", error);
    return {
      error: UNREACHABLE,
      field: null,
      saved: false,
      updated: false,
      message: null,
    };
  }

  revalidatePath("/", "layout");
  return {
    error: null,
    field: null,
    saved: true,
    updated: result.updated,
    message: result.updated ? "Updated today's log." : "Saved today's log.",
  };
}

export async function sellEggsAction(
  _prev: SaleState,
  formData: FormData,
): Promise<SaleState> {
  const user = await requireUser();

  const parsed = eggSaleSchema.safeParse({
    flockId: formData.get("flockId"),
    eggs: formData.get("eggs"),
    pricePerTrayNaira: formData.get("pricePerTrayNaira"),
  });
  if (!parsed.success) {
    return { error: firstIssue(parsed.error), saved: false, message: null };
  }

  const pricePerTrayKobo = Math.round(parsed.data.pricePerTrayNaira * 100);

  try {
    // Stock is recomputed inside the write, so a stale page cannot oversell.
    await sellEggsForUser(writes, {
      userId: user.userId,
      flockId: parsed.data.flockId,
      date: todayInAppTz(),
      eggs: parsed.data.eggs,
      pricePerTrayKobo,
    });
  } catch (error) {
    if (error instanceof NotAuthorizedError) {
      return { error: NOT_YOURS, saved: false, message: null };
    }
    if (error instanceof ValidationError) {
      return { error: error.message, saved: false, message: null };
    }
    console.error("Saving an egg sale failed:", error);
    return { error: UNREACHABLE, saved: false, message: null };
  }

  revalidatePath("/", "layout");
  return {
    error: null,
    saved: true,
    message: `Sold ${parsed.data.eggs} eggs.`,
  };
}
