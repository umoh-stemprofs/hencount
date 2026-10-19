// Salt search for the deterministic generator (00-global.md §3). The rule
// is "today at least one crop is rising and one is falling" so the demo
// shows both directions — but "today" must hold for ANY day a judge runs
// it, not only the day the salts were picked (a step-6 audit found 5 days
// in 2026-2028 where every crop moved the same way). This script scans a
// multi-year window, hill-climbs per-crop salt candidates until the
// invariant holds on EVERY day of the window, then prints the catalog
// lines and the fixed regression prices to paste into catalog.ts and
// generator.test.ts.
//
//   npx tsx scripts/pick-salts.ts
import { Crop, Unit } from "@prisma/client";
import { CATALOG } from "../lib/market/catalog";
import { deviationSeries } from "../lib/market/generator";

/** Day indices scanned: k = 2 (first day with a yesterday) through ~3 years. */
const WINDOW_START_K = 2;
const WINDOW_END_K = 1096;
const CANDIDATES_PER_CROP = 40;
const MAX_PASSES = 60;

/** Price direction vs the previous day: 1 up, -1 down, 0 flat. */
type Directions = Int8Array;

const slug = (crop: Crop) => crop.toLowerCase().replace(/_/g, "");

const directionsCache = new Map<string, Directions>();

function directionsFor(
  crop: Crop,
  baseKobo: number,
  unit: Unit,
  salt: string,
): Directions {
  const key = `${crop}|${salt}`;
  const hit = directionsCache.get(key);
  if (hit) return hit;

  const xs = deviationSeries({ crop, label: crop, unit, baseKobo, salt }, WINDOW_END_K);
  const dirs = new Int8Array(WINDOW_END_K + 1);
  for (let k = WINDOW_START_K; k <= WINDOW_END_K; k++) {
    const price = Math.round(baseKobo * Math.exp(xs[k]));
    const previous = Math.round(baseKobo * Math.exp(xs[k - 1]));
    dirs[k] = price > previous ? 1 : price < previous ? -1 : 0;
  }
  directionsCache.set(key, dirs);
  return dirs;
}

/** Days in the window where NOT (some crop up AND some crop down). */
function failingDays(
  saltByCrop: Map<Crop, string>,
): number[] {
  const perCrop = CATALOG.map((meta) => ({
    meta,
    dirs: directionsFor(
      meta.crop,
      meta.baseKobo,
      meta.unit,
      saltByCrop.get(meta.crop)!,
    ),
  }));
  const fails: number[] = [];
  for (let k = WINDOW_START_K; k <= WINDOW_END_K; k++) {
    let up = false;
    let down = false;
    for (const { dirs } of perCrop) {
      const dir = dirs[k];
      if (dir > 0) up = true;
      else if (dir < 0) down = true;
      if (up && down) break;
    }
    if (!up || !down) fails.push(k);
  }
  return fails;
}

function main() {
  const dayKey = (k: number) =>
    new Date(Date.UTC(2026, 0, 1) + k * 86_400_000).toISOString().slice(0, 10);

  // Start from the salts currently in the catalog, then hill-climb: in each
  // pass, every crop tries its candidates and keeps the first swap that
  // removes failing days.
  const current = new Map<Crop, string>(
    CATALOG.map((meta) => [meta.crop, meta.salt]),
  );

  let fails = failingDays(current);
  console.log(`window ${dayKey(WINDOW_START_K)} .. ${dayKey(WINDOW_END_K)}`);
  console.log(`starting failures: ${fails.length}`);

  let pass = 0;
  while (fails.length > 0 && pass < MAX_PASSES) {
    pass++;
    let improved = false;
    for (const meta of CATALOG) {
      if (fails.length === 0) break;
      const before = failingDays(current).length;
      let bestSalt = current.get(meta.crop)!;
      for (let i = 0; i < CANDIDATES_PER_CROP; i++) {
        const candidate = `hc-${slug(meta.crop)}-v2-${i}`;
        if (candidate === bestSalt) continue;
        const trial = new Map(current);
        trial.set(meta.crop, candidate);
        if (failingDays(trial).length < before) {
          bestSalt = candidate;
          improved = true;
          break;
        }
      }
      current.set(meta.crop, bestSalt);
      fails = failingDays(current);
    }
    if (!improved) break;
  }

  if (fails.length > 0) {
    console.error(
      `STUCK with ${fails.length} failing days: ${fails.slice(0, 10).map(dayKey).join(", ")}...`,
    );
    process.exitCode = 1;
    return;
  }
  console.log(`passes: ${pass} · failures: 0 ✓\n`);

  console.log("Catalog lines (paste into lib/market/catalog.ts):");
  for (const meta of CATALOG) {
    console.log(
      `  { crop: Crop.${meta.crop}, label: ${JSON.stringify(
        meta.label,
      )}, unit: Unit.${meta.unit}, baseKobo: ${meta.baseKobo}, salt: "${current.get(meta.crop)}" },`,
    );
  }

  // Fixed regression prices for generator.test.ts (never change on re-runs).
  const metaFor = (crop: Crop) => {
    const meta = CATALOG.find((m) => m.crop === crop)!;
    return { ...meta, salt: current.get(crop)! };
  };
  const priceAt = (crop: Crop, y: number, m: number, d: number) => {
    const meta = metaFor(crop);
    const xs = deviationSeries(meta, Math.round(
      (Date.UTC(y, m, d) - Date.UTC(2026, 0, 1)) / 86_400_000,
    ));
    return Math.round(meta.baseKobo * Math.exp(xs[xs.length - 1]));
  };
  console.log("\nRegression values (generator.test.ts):");
  console.log(
    `  EGGS 2026-01-02 = ${priceAt(Crop.EGGS_TRAY, 2026, 0, 2)} · 2026-06-15 = ${priceAt(Crop.EGGS_TRAY, 2026, 5, 15)}`,
  );
  console.log(
    `  MAIZE 2026-01-02 = ${priceAt(Crop.MAIZE, 2026, 0, 2)} · 2026-06-15 = ${priceAt(Crop.MAIZE, 2026, 5, 15)}`,
  );

  // A quick eyeball: today's 14-day trend per crop (arrows + price).
  const todayK = Math.floor(
    (Date.now() - Date.UTC(2026, 0, 1)) / 86_400_000,
  );
  const k = Math.min(Math.max(todayK, WINDOW_START_K), WINDOW_END_K);
  console.log(`\nTrend window ending ${dayKey(k)} (for eyeballing):`);
  for (const meta of CATALOG) {
    const xs = deviationSeries(metaFor(meta.crop), k);
    const arrows = xs
      .slice(Math.max(1, k - 13))
      .map((x, i, arr) => {
        if (i === 0) return "";
        return x > arr[i - 1] ? "↑" : x < arr[i - 1] ? "↓" : "→";
      })
      .join("");
    const price = Math.round(meta.baseKobo * Math.exp(xs[k]));
    console.log(`  ${meta.crop.padEnd(12)} ${arrows}  ${price}`);
  }
}

main();
