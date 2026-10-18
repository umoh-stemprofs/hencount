// The market catalog for the simulated live feed (00-global.md §3).
// Base prices are SAMPLES in kobo (₦1 = 100 kobo) — edit to match local
// markets; an expert must review them before real use.
// (Not server-only: no secrets here, and tests/scripts import it directly.)
import { Crop, Unit } from "@prisma/client";

export interface CropMeta {
  crop: Crop;
  /** Human label for the UI. */
  label: string;
  unit: Unit;
  /** Sample base price in kobo per unit. */
  baseKobo: number;
  /**
   * Per-crop salt for the deterministic generator. Chosen so that, today,
   * at least one crop is rising and one is falling (see generator.test.ts,
   * which prints the 14-day trends and asserts the invariant).
   */
  salt: string;
}

export const CATALOG: CropMeta[] = [
  { crop: Crop.MAIZE, label: "Maize", unit: Unit.KG, baseKobo: 60_000, salt: "hc-maize-v1-1" },
  { crop: Crop.CASSAVA, label: "Cassava", unit: Unit.KG, baseKobo: 35_000, salt: "hc-cassava-v1-0" },
  { crop: Crop.YAM, label: "Yam", unit: Unit.KG, baseKobo: 90_000, salt: "hc-yam-v1-3" },
  { crop: Crop.RICE_PADDY, label: "Rice paddy", unit: Unit.KG, baseKobo: 85_000, salt: "hc-ricepaddy-v1-0" },
  { crop: Crop.TOMATO, label: "Tomato", unit: Unit.KG, baseKobo: 70_000, salt: "hc-tomato-v1-2" },
  { crop: Crop.TILAPIA, label: "Tilapia", unit: Unit.KG, baseKobo: 250_000, salt: "hc-tilapia-v1-0" },
  { crop: Crop.CATFISH, label: "Catfish", unit: Unit.KG, baseKobo: 280_000, salt: "hc-catfish-v1-0" },
  {
    crop: Crop.EGGS_TRAY,
    label: "Eggs (tray of 30)",
    unit: Unit.TRAY,
    baseKobo: 380_000,
    salt: "hc-eggstray-v1-3",
  },
  { crop: Crop.PALM_OIL, label: "Palm oil", unit: Unit.LITRE, baseKobo: 180_000, salt: "hc-palmoil-v1-2" },
];

export function getCrop(crop: Crop): CropMeta | undefined {
  return CATALOG.find((c) => c.crop === crop);
}
