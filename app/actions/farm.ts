// Farm settings action. Re-checks the session itself, validates with Zod,
// and only ever touches the caller's own farm (00-global.md §3 security).
// Feed price arrives in naira and is stored as integer kobo (§2).
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { AUTH_ERRORS, firstIssue } from "@/lib/auth";
import { getFarmForUser } from "@/lib/data";
import { requireUser } from "@/lib/session";
import { farmSchema } from "@/lib/validation";

export interface FarmFormState {
  error: string | null;
  saved: boolean;
}

export async function saveFarmAction(
  _prev: FarmFormState,
  formData: FormData,
): Promise<FarmFormState> {
  const user = await requireUser();

  const parsed = farmSchema.safeParse({
    name: formData.get("name"),
    lat: formData.get("lat"),
    lon: formData.get("lon"),
    feedPriceNaira: formData.get("feedPriceNaira"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error), saved: false };

  const feedPriceKobo = Math.round(parsed.data.feedPriceNaira * 100);

  try {
    // getFarmForUser is scoped to this user's id — there is no way to reach
    // another farmer's farm from this action.
    const existing = await getFarmForUser(user.userId);
    const farm = existing
      ? await db.farm.update({
          where: { id: existing.id },
          data: { name: parsed.data.name, lat: parsed.data.lat, lon: parsed.data.lon },
        })
      : await db.farm.create({
          data: {
            userId: user.userId,
            name: parsed.data.name,
            lat: parsed.data.lat,
            lon: parsed.data.lon,
          },
        });

    await db.feedPrice.upsert({
      where: { farmId: farm.id },
      update: { priceKobo: feedPriceKobo },
      create: { farmId: farm.id, priceKobo: feedPriceKobo },
    });
  } catch (error) {
    // Infrastructure failure (e.g. database unreachable): one plain
    // sentence, no crash (design.md §6).
    console.error("Saving farm settings could not reach the database:", error);
    return { error: AUTH_ERRORS.unexpected, saved: false };
  }

  // The dashboard, weather card and stock figures read the farm and its feed
  // price, so drop their cached renders — otherwise a client-side navigation
  // back to / shows the pre-save numbers.
  revalidatePath("/", "layout");

  return { error: null, saved: true };
}
