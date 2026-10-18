// Zod validation of external weather responses. Shapes verified against the
// official docs (see /docs/api.md):
//   Open-Meteo  https://open-meteo.com/en/docs  (current + daily arrays)
//   OpenWeatherMap https://openweathermap.org/api/forecast5 (list[] 3-hourly)
// Anything unexpected is rejected — never trust an external payload.
import { z } from "zod";

export const weatherNowSchema = z.object({
  tempC: z.number(),
  humidity: z.number(),
  windKmh: z.number(),
  text: z.string(),
});

export const weatherDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  minC: z.number(),
  maxC: z.number(),
  rainMm: z.number(),
  rainChancePct: z.number(),
});

/** Shape stored in WeatherSnapshot.payload. */
export const snapshotPayloadSchema = z.object({
  current: weatherNowSchema,
  daily: z.array(weatherDaySchema),
});

// --- Open-Meteo ---------------------------------------------------------

export const openMeteoResponseSchema = z.object({
  current: z.object({
    temperature_2m: z.number(),
    relative_humidity_2m: z.number(),
    wind_speed_10m: z.number(),
    weather_code: z.number(),
  }),
  daily: z.object({
    time: z.array(z.string()).min(1),
    temperature_2m_max: z.array(z.number().nullable()),
    temperature_2m_min: z.array(z.number().nullable()),
    precipitation_sum: z.array(z.number().nullable()),
    precipitation_probability_max: z.array(z.number().nullable()),
  }),
});

// --- OpenWeatherMap 5-day / 3-hour --------------------------------------

export const owmResponseSchema = z.object({
  list: z
    .array(
      z.object({
        dt: z.number(),
        dt_txt: z.string(),
        main: z.object({
          temp: z.number(),
          temp_min: z.number(),
          temp_max: z.number(),
          humidity: z.number(),
        }),
        weather: z
          .array(z.object({ main: z.string(), description: z.string() }))
          .min(1),
        pop: z.number().optional(),
        wind: z.object({ speed: z.number() }).optional(),
        rain: z.record(z.number()).optional(),
        snow: z.record(z.number()).optional(),
      }),
    )
    .min(1),
});
