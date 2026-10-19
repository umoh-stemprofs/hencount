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
  // Speed (step 6): farm and feed price are fetched together (the feed
  // price is read through its farm's owner, not the farm row's id).
  const user = await requireUser();
  const [farm, feedPrice] = await Promise.all([
    getFarmForUser(user.userId),
    db.feedPrice.findFirst({ where: { farm: { userId: user.userId } } }),
  ]);

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
