// One-off helper used while building step 2: scan salt candidates so that,
// today, some crops rise and some fall (00-global.md §3). Prints the chosen
// salts plus fixed regression prices to paste into the tests.
import { Crop, Unit } from "@prisma/client";
import { CropMeta } from "../lib/market/catalog";
import { priceOn } from "../lib/market/generator";
import { addDays, todayInAppTz } from "../lib/dates";

// crop, base kobo, desired sign today (+1 rising, −1 falling)
const WANTED: { crop: Crop; baseKobo: number; unit: Unit; sign: 1 | -1 }[] = [
  { crop: Crop.MAIZE, baseKobo: 60_000, unit: Unit.KG, sign: -1 },
  { crop: Crop.CASSAVA, baseKobo: 35_000, unit: Unit.KG, sign: 1 },
  { crop: Crop.YAM, baseKobo: 90_000, unit: Unit.KG, sign: -1 },
  { crop: Crop.RICE_PADDY, baseKobo: 85_000, unit: Unit.KG, sign: 1 },
  { crop: Crop.TOMATO, baseKobo: 70_000, unit: Unit.KG, sign: -1 },
  { crop: Crop.TILAPIA, baseKobo: 250_000, unit: Unit.KG, sign: 1 },
  { crop: Crop.CATFISH, baseKobo: 280_000, unit: Unit.KG, sign: -1 },
  { crop: Crop.EGGS_TRAY, baseKobo: 380_000, unit: Unit.TRAY, sign: 1 },
  { crop: Crop.PALM_OIL, baseKobo: 180_000, unit: Unit.LITRE, sign: -1 },
];

const today = todayInAppTz();
console.log(`today = ${today.toISOString().slice(0, 10)}\n`);

const chosen: { meta: CropMeta; changePct: number }[] = [];
for (const want of WANTED) {
  let found = false;
  for (let i = 0; i < 400; i++) {
    const meta: CropMeta = {
      crop: want.crop,
      label: want.crop,
      unit: want.unit,
      baseKobo: want.baseKobo,
      salt: `hc-${want.crop.toLowerCase().replace(/_/g, "")}-v1-${i}`,
    };
    const pct = pctChange(meta, today);
    if (pct !== null && Math.abs(pct) >= 0.2 && Math.abs(pct) <= 4 && Math.sign(pct) === want.sign) {
      console.log(`${want.crop.padEnd(12)} salt=${meta.salt.padEnd(28)} ${pct > 0 ? "+" : ""}${pct.toFixed(2)}%`);
      chosen.push({ meta, changePct: pct });
      found = true;
      break;
    }
  }
  if (!found) console.log(`${want.crop}: NO CANDIDATE FOUND`);
}

function pctChange(meta: CropMeta, date: Date): number | null {
  const y = priceOn(meta, addDays(date, -1));
  const t = priceOn(meta, date);
  return ((t - y) / y) * 100;
}

// Regression values for the test file (EGGS_TRAY + MAIZE at fixed dates).
const eggs: CropMeta = chosen.find((c) => c.meta.crop === Crop.EGGS_TRAY)!.meta;
const maize: CropMeta = chosen.find((c) => c.meta.crop === Crop.MAIZE)!.meta;
for (const d of [new Date(Date.UTC(2026, 0, 2)), new Date(Date.UTC(2026, 5, 15)), today]) {
  console.log(
    `price EGGS_TRAY ${d.toISOString().slice(0, 10)} = ${priceOn(eggs, d)} · MAIZE = ${priceOn(maize, d)}`,
  );
}

const rising = chosen.filter((c) => c.changePct > 0).length;
console.log(`\nrising: ${rising}, falling: ${chosen.length - rising}`);
