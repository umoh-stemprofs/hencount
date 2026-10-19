// Farm alerts from the forecast. Thresholds in /lib/config.ts are SAMPLES —
// a poultry expert must confirm them (docs/03-hencount.md).
import { ALERTS } from "./config";
import type { WeatherDay } from "./weather/types";

export interface HeatAlert {
  type: "HEAT";
  /** "YYYY-MM-DD" of the first hot day. */
  date: string;
  maxC: number;
  message: string;
}

/** The banner sentence — shared by the real alert and its demo preview. */
export const HEAT_MESSAGE = "Hot day. Give cool water. Eggs may drop.";

/** Heat alert when a forecast day's maxC is at or above the threshold. */
export function heatAlert(daily: WeatherDay[]): HeatAlert | null {
  const hot = daily.find((day) => day.maxC >= ALERTS.heatMaxC);
  if (!hot) return null;
  return {
    type: "HEAT",
    date: hot.date,
    maxC: hot.maxC,
    message: HEAT_MESSAGE,
  };
}
