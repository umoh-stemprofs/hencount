# API documentation — HenCount

Two kinds of calls in this app:

1. **External** (outbound, from the server only): weather.
2. **Market feed** (inbound, our own routes): a *simulated live feed* we
   generate ourselves. `MARKET_API_URL` can point it at a real service.

Nothing external is ever called from the browser. API keys live only in
`.env` (git-ignored) and are read on the server.

---

## External calls

### OpenWeatherMap 5-day / 3-hour forecast (only when `OWM_API_KEY` is set)

- **URL pattern**: `https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={KEY}&units=metric`
- **Key name**: `OWM_API_KEY` (env only, never committed)
- **Docs**: https://openweathermap.org/api/forecast5
- **Notes**: `units=metric` gives °C; wind speed is m/s (converted to km/h);
  `pop` is 0–1 (converted to %); the 3-hourly `list[]` is folded into 5
  calendar days in `APP_TZ`. `temp_min`/`temp_max` are moment values, so we
  compute daily min/max from each day's `main.temp` values instead.
- **Sample response** (abbreviated):

```json
{
  "list": [
    {
      "dt": 1792333200,
      "dt_txt": "2026-10-18 09:00:00",
      "main": { "temp": 30.1, "temp_min": 29.4, "temp_max": 30.8, "humidity": 74 },
      "weather": [{ "main": "Clouds", "description": "scattered clouds" }],
      "pop": 0.4,
      "wind": { "speed": 3.2 },
      "rain": { "3h": 0.4 }
    }
  ]
}
```

### Open-Meteo forecast (default — no key needed)

- **URL pattern**: `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&forecast_days=5&timezone={APP_TZ}`
- **Key name**: none
- **Docs**: https://open-meteo.com/en/docs
- **Notes**: wind speed is km/h already; `weather_code` is a WMO code mapped
  to text in `lib/weather/openMeteo.ts`; daily arrays can contain `null`
  (treated as no value — rain shows 0, never invented).
- **Sample response** (abbreviated):

```json
{
  "current": {
    "temperature_2m": 26.0,
    "relative_humidity_2m": 90,
    "wind_speed_10m": 6.4,
    "weather_code": 2
  },
  "daily": {
    "time": ["2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22"],
    "temperature_2m_max": [33.1, 34.5, 32.0, 31.2, 30.4],
    "temperature_2m_min": [24.0, 25.1, 24.2, 23.5, 23.0],
    "precipitation_sum": [0.0, 1.5, 0.0, 0.0, 4.2],
    "precipitation_probability_max": [10, 60, 0, 5, 80]
  }
}
```

### Weather call policy (both providers)

- Server-side only; hard timeout 5 s; one retry (`lib/weather/http.ts`).
- Every response is validated with Zod (`lib/weather/schemas.ts`); anything
  unexpected is rejected.
- Successful responses are cached in `WeatherSnapshot` for 30 minutes.
- On failure: serve the last saved snapshot ("Saved data · X h old"). With no
  snapshot: an error the page shows, and the rest of the app keeps working.

---

## Our market feed (built in this app)

Deterministic "simulated live feed" (`lib/market/generator.ts`): same crop +
salt + date always gives the same price. If `MARKET_API_URL` is set, the app
fetches that base URL instead and falls back to the simulated feed on any
failure; the badge shows the real source.

### `GET /api/market/prices`

Latest price of every crop in the catalog.

```json
[
  { "crop": "MAIZE", "date": "2026-10-18", "priceKobo": 58911, "unit": "KG", "source": "SIMULATED" },
  { "crop": "EGGS_TRAY", "date": "2026-10-18", "priceKobo": 412400, "unit": "TRAY", "source": "SIMULATED" }
]
```

### `GET /api/market/history?crop=EGGS_TRAY&days=30`

One crop's history ending today, oldest first. `days` is 1–90 (default 30).
Bad input returns 400 with one sentence saying what to fix.

```json
[
  { "crop": "EGGS_TRAY", "date": "2026-10-16", "priceKobo": 401540, "unit": "TRAY", "source": "SIMULATED" },
  { "crop": "EGGS_TRAY", "date": "2026-10-17", "priceKobo": 408246, "unit": "TRAY", "source": "SIMULATED" },
  { "crop": "EGGS_TRAY", "date": "2026-10-18", "priceKobo": 412400, "unit": "TRAY", "source": "SIMULATED" }
]
```

Money is integer kobo (₦1 = 100 kobo); dates are `YYYY-MM-DD` in `APP_TZ`.
Sample base prices and alert thresholds are placeholders — an expert must
review them before real use.
