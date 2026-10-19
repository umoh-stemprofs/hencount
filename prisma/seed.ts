import "dotenv/config";
import { Crop, PrismaClient, Unit } from "@prisma/client";
import { hash } from "bcryptjs";
import { formatNaira } from "../lib/dates";

/**
 * Seed for step 1: one farmer, one farm, feed price, seven days of simulated
 * egg-tray prices, and ONE FLOCK PER ADVICE STATE — KEEP_ADDING, "few eggs",
 * "too much feed" and GOOD — so every result state of docs/03-hencount.md
 * can be seen from day one. Two more flocks complete the step-5 demo:
 * "Harbour layers" has a LOSS day (eggs crashed, feed did not), so its profit
 * chart shows red between green days, and the tiny "Kitchen coop" is the
 * sixth flock, which makes the dashboard's value pie show its "Other" slice
 * (max 5 slices).
 *
 * Idempotent: running it twice leaves the same rows, not duplicates.
 * Re-running also removes day logs and sales that are not listed below —
 * e.g. rows a click-through left behind — but it never deletes a flock it
 * does not know.
 * Demo password is documented in README.md only.
 */

const db = new PrismaClient();

const DEMO = {
  userId: "usr_demo",
  email: "demo@hencount.test",
  name: "Chidi Okafor",
  password: "demo1234",
  farmId: "farm_demo",
  farmName: "Port Harcourt farm",
  // Default farm location from docs/00-global.md §3.
  lat: 4.8156,
  lon: 7.0498,
};

// ₦650 per kg of feed = 65,000 kobo. SAMPLE (00-global.md §2): the number is
// chosen so the demo shows BOTH profit and loss days against the catalog
// tray price ₦3,800 — the healthy flocks earn, the weak ones lose — and it
// must be confirmed with the farm before real use.
const FEED_PRICE_KOBO = 65000;

/** Today's calendar day in APP_TZ, never the server's clock zone. */
function todayInAppTz(): Date {
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.APP_TZ || "Africa/Lagos",
  }).format(new Date());
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

const daysAgo = (n: number): Date =>
  new Date(todayInAppTz().getTime() - n * 86_400_000);

/**
 * Seven days of SIMULATED egg-tray prices (oldest first, last one is today),
 * around the catalog price ₦3,800/tray of 30 (docs/00-global.md §3).
 * Step 2 replaces this with the deterministic generator; until then it keeps
 * the stock-value maths honest.
 */
const EGG_PRICE_SERIES_KOBO = [372000, 375000, 374000, 378000, 379000, 381000, 380000];

/**
 * One flock per state. Each row's numbers land exactly on its state under
 * docs/03-hencount.md rule order (values are placeholders until a poultry
 * expert reviews them):
 *
 *   GOOD        3+ logs · avg rate (82+84+85)/100 = 83.7% ≥ 60
 *               avg feed/hen (11.7+11.9+12.0)/3 × 1000/100 = 118.7 g ≤ 140
 *   FEW_EGGS    3 logs · avg rate 49.7% < 60, feed/hen ~120 g ≤ 140
 *               → "Few eggs. Check water, light and hen health."
 *   TOO_MUCH    3 logs · avg rate 84.6% ≥ 60, feed/hen ~170 g > 140
 *               → "Too much feed. Give a little less."
 *   KEEP_ADDING only 2 logs → "Add 3 days to see advice."
 *
 * Two step-5 extras:
 *   Loss day     "Harbour layers" is GOOD but laid only 35 eggs yesterday
 *                while eating its usual feed, so that day's profit is a
 *                clear loss — red between green days on the profit chart.
 *   Other slice  "Kitchen coop" (25 hens) is the sixth flock; more than 5
 *                flocks makes the dashboard's value pie group the tail into
 *                "Other".
 */
// No ids on logs: they are keyed by the schema's unique (flockId, date), so
// re-running on a LATER day slides the whole window forward instead of
// colliding on a hardcoded id (the step-1 seed broke on day two).
type SeedLog = { day: number; hens: number; eggs: number; feedKg: number };

type SeedFlock = {
  id: string;
  name: string;
  logs: SeedLog[];
  sales?: { id: string; day: number; eggs: number; pricePerTrayKobo: number }[];
};

const FLOCKS: SeedFlock[] = [
  {
    id: "flock_good",
    name: "Mango Creek layers",
    logs: [
      { day: 6, hens: 100, eggs: 84, feedKg: 11.8 },
      { day: 5, hens: 100, eggs: 86, feedKg: 12.1 },
      { day: 4, hens: 100, eggs: 83, feedKg: 11.9 },
      { day: 3, hens: 100, eggs: 85, feedKg: 12.0 },
      { day: 2, hens: 100, eggs: 82, feedKg: 11.7 },
      { day: 1, hens: 100, eggs: 84, feedKg: 11.9 },
      { day: 0, hens: 100, eggs: 85, feedKg: 12.0 },
    ],
    // 589 laid total; 210 sold → stock 379 eggs. Never sells more than stock.
    sales: [
      { id: "sale_good_1", day: 4, eggs: 120, pricePerTrayKobo: 380000 },
      { id: "sale_good_2", day: 1, eggs: 90, pricePerTrayKobo: 375000 },
    ],
  },
  {
    id: "flock_few",
    name: "Palm Grove layers",
    logs: [
      { day: 2, hens: 120, eggs: 58, feedKg: 14.4 },
      { day: 1, hens: 120, eggs: 61, feedKg: 14.2 },
      { day: 0, hens: 120, eggs: 60, feedKg: 14.5 },
    ],
  },
  {
    id: "flock_too_much",
    name: "Creek Side layers",
    logs: [
      { day: 2, hens: 80, eggs: 66, feedKg: 13.5 },
      { day: 1, hens: 80, eggs: 68, feedKg: 13.6 },
      { day: 0, hens: 80, eggs: 69, feedKg: 13.7 },
    ],
    // 203 laid total; 60 sold → stock 143 eggs.
    sales: [{ id: "sale_much_1", day: 1, eggs: 60, pricePerTrayKobo: 380000 }],
  },
  {
    id: "flock_new",
    name: "Point of lay pullets",
    logs: [
      { day: 1, hens: 150, eggs: 95, feedKg: 17.5 },
      { day: 0, hens: 150, eggs: 98, feedKg: 17.8 },
    ],
  },
  {
    // GOOD advice, but yesterday's eggs crashed (35) while feed stayed the
    // same → that day's profit is a loss. The demo's red day on the chart.
    id: "flock_harbour",
    name: "Harbour layers",
    logs: [
      { day: 2, hens: 120, eggs: 100, feedKg: 12.5 },
      { day: 1, hens: 120, eggs: 35, feedKg: 12.5 },
      { day: 0, hens: 120, eggs: 100, feedKg: 12.5 },
    ],
  },
  {
    // The sixth flock: keeps the value pie at its 5-slice limit so the tail
    // shows up as "Other" (design.md §4).
    id: "flock_kitchen",
    name: "Kitchen coop",
    logs: [
      { day: 2, hens: 25, eggs: 19, feedKg: 2.6 },
      { day: 1, hens: 25, eggs: 21, feedKg: 2.7 },
      { day: 0, hens: 25, eggs: 20, feedKg: 2.8 },
    ],
  },
];

async function main() {
  const passHash = await hash(DEMO.password, 10);

  const user = await db.user.upsert({
    where: { email: DEMO.email },
    update: { name: DEMO.name, passHash },
    create: { id: DEMO.userId, email: DEMO.email, name: DEMO.name, passHash },
  });

  const farm = await db.farm.upsert({
    where: { id: DEMO.farmId },
    update: { userId: user.id, name: DEMO.farmName, lat: DEMO.lat, lon: DEMO.lon, currency: "NGN" },
    create: {
      id: DEMO.farmId,
      userId: user.id,
      name: DEMO.farmName,
      lat: DEMO.lat,
      lon: DEMO.lon,
      currency: "NGN",
    },
  });

  await db.feedPrice.upsert({
    where: { farmId: farm.id },
    update: { priceKobo: FEED_PRICE_KOBO },
    create: { farmId: farm.id, priceKobo: FEED_PRICE_KOBO },
  });

  // Egg-tray prices: upserted by unique(crop, date), so a re-run never
  // duplicates and step 2's generator can overwrite them in place later.
  let tickCount = 0;
  for (let i = 0; i < EGG_PRICE_SERIES_KOBO.length; i++) {
    const date = daysAgo(EGG_PRICE_SERIES_KOBO.length - 1 - i);
    await db.priceTick.upsert({
      where: { crop_date: { crop: Crop.EGGS_TRAY, date } },
      update: { priceKobo: EGG_PRICE_SERIES_KOBO[i] },
      create: {
        crop: Crop.EGGS_TRAY,
        date,
        priceKobo: EGG_PRICE_SERIES_KOBO[i],
        unit: Unit.TRAY,
        source: "SIMULATED",
      },
    });
    tickCount++;
  }

  for (const flock of FLOCKS) {
    await db.flock.upsert({
      where: { id: flock.id },
      update: { farmId: farm.id, name: flock.name },
      create: { id: flock.id, farmId: farm.id, name: flock.name },
    });

    for (const log of flock.logs) {
      const date = daysAgo(log.day);
      const data = { hens: log.hens, eggs: log.eggs, feedKg: log.feedKg };
      await db.dayLog.upsert({
        where: { flockId_date: { flockId: flock.id, date } },
        update: data,
        create: { flockId: flock.id, date, ...data },
      });
    }

    for (const sale of flock.sales ?? []) {
      const date = daysAgo(sale.day);
      const data = { eggs: sale.eggs, pricePerTrayKobo: sale.pricePerTrayKobo };
      await db.eggSale.upsert({
        where: { id: sale.id },
        update: { flockId: flock.id, date, ...data },
        create: { id: sale.id, flockId: flock.id, date, ...data },
      });
    }
  }

  // Make a re-run converge on exactly this demo data: every log of a seed
  // flock must sit on THAT flock's own window for this run (the window
  // slides each day), so leftovers a click-through left behind — old dates,
  // extra days — go, while flocks the seed does not know are never touched.
  const flockIds = FLOCKS.map((f) => f.id);
  for (const flock of FLOCKS) {
    const ownDates = flock.logs.map((log) => daysAgo(log.day));
    await db.dayLog.deleteMany({
      where: { flockId: flock.id, date: { notIn: ownDates } },
    });
  }
  await db.eggSale.deleteMany({
    where: {
      flockId: { in: flockIds },
      id: { notIn: FLOCKS.flatMap((f) => (f.sales ?? []).map((s) => s.id)) },
    },
  });

  const [feedPrice, latestTick, flocks] = await Promise.all([
    db.feedPrice.findUnique({ where: { farmId: farm.id } }),
    db.priceTick.findFirst({
      where: { crop: Crop.EGGS_TRAY },
      orderBy: { date: "desc" },
    }),
    db.flock.findMany({
      where: { farmId: farm.id },
      orderBy: { name: "asc" },
      include: {
        logs: { orderBy: { date: "desc" }, take: 3 },
        sales: { select: { eggs: true } },
      },
    }),
  ]);

  console.log(`\nFarm   ${farm.name} (${farm.lat}, ${farm.lon}) · ${farm.currency}`);
  console.log(`User   ${user.name} <${user.email}>`);
  console.log(`Feed   ${feedPrice ? formatNaira(feedPrice.priceKobo) : "?"} per kg`);
  console.log(`Prices ${tickCount} egg-tray ticks over ${EGG_PRICE_SERIES_KOBO.length} days (Simulated)`);
  if (latestTick) {
    console.log(`       latest ${formatNaira(latestTick.priceKobo)} per tray as of ${latestTick.date.toISOString().slice(0, 10)}`);
  }

  console.log(`\nFlocks ${flocks.length} — one per advice state + a loss day + a small coop:`);
  for (const flock of flocks) {
    const laid = flock.logs.reduce((sum, l) => sum + l.eggs, 0);
    const sold = flock.sales.reduce((sum, s) => sum + s.eggs, 0);
    const avgRate =
      flock.logs.length === 0
        ? "—"
        : `${(flock.logs.reduce((s, l) => s + (l.eggs / l.hens) * 100, 0) / flock.logs.length).toFixed(1)}%`;
    const state = flock.logs.length < 3 ? "KEEP_ADDING" : `avg rate ${avgRate}`;
    console.log(
      `       ${flock.name.padEnd(20)} ${flock.logs.length} recent log(s) · ${state} · sold ${sold} of ${laid} laid in window`,
    );
  }
  console.log(`\nSeed complete.\n`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
