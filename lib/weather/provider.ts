// WeatherProvider adapter: OpenWeatherMap when OWM_API_KEY is set,
// otherwise Open-Meteo (no key). Server-side only.
import "server-only";
import { fetchOpenMeteo } from "./openMeteo";
import { fetchOwm } from "./owm";
import type { WeatherData } from "./types";

export interface WeatherProvider {
  source: "OPEN_METEO" | "OPENWEATHERMAP";
  fetchCurrent(lat: number, lon: number): Promise<WeatherData>;
}

class OpenMeteoProvider implements WeatherProvider {
  source = "OPEN_METEO" as const;
  fetchCurrent(lat: number, lon: number): Promise<WeatherData> {
    return fetchOpenMeteo(lat, lon);
  }
}

class OwmProvider implements WeatherProvider {
  source = "OPENWEATHERMAP" as const;
  constructor(private apiKey: string) {}
  fetchCurrent(lat: number, lon: number): Promise<WeatherData> {
    return fetchOwm(lat, lon, this.apiKey);
  }
}

export function getWeatherProvider(): WeatherProvider {
  const key = process.env.OWM_API_KEY;
  return key ? new OwmProvider(key) : new OpenMeteoProvider();
}
