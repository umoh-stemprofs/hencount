// Farm settings (design.md S-FARM, docs/03-hencount.md §9): farm name,
// latitude, longitude, an optional "Use my location" button, and the feed
// price per kg in naira (stored as integer kobo). Feeds the dashboard's
// weather card and profit maths.
import { SettingsForm } from "@/components/SettingsForm";
import { DEFAULT_FARM } from "@/lib/config";
import { getFarmForUser } from "@/lib/data";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const farm = await getFarmForUser(user.userId);
  const feedPrice = farm
    ? await db.feedPrice.findUnique({ where: { farmId: farm.id } })
    : null;

  return (
    <div className="max-w-xl">
      <header>
        <h1 className="text-2xl font-semibold text-text">Farm settings</h1>
        <p className="mt-1 max-w-[70ch] leading-6 text-muted">
          Your farm&apos;s coordinates drive the weather, and the feed price
          drives feed cost and profit.
        </p>
      </header>

      <SettingsForm
        initial={{
          name: farm?.name ?? "",
          lat: farm?.lat ?? DEFAULT_FARM.lat,
          lon: farm?.lon ?? DEFAULT_FARM.lon,
          feedPriceNaira: feedPrice ? feedPrice.priceKobo / 100 : "",
        }}
      />
    </div>
  );
}
