# Task overview — HenCount

HenCount is a daily egg-and-feed logger for a small poultry farmer. Each day
the farmer records how many hens were in a flock, how many eggs were
collected and how much feed (kg) was used. The app turns those three numbers
into the two things a farmer needs to decide with: **how the flock is
laying** (advice) and **what the day earned** (profit) — and it keeps a live
value on the eggs still in stock.

## The APIs used

| Call | Direction | Live or simulated | Notes |
|---|---|---|---|
| Open-Meteo forecast (`api.open-meteo.com/v1/forecast`) | Outbound, server-side only | **Live** | The farm's own lat/lon. No key needed. 5 s timeout, one retry, Zod-validated, cached 30 min in `WeatherSnapshot`. Shown with the "Live" badge on the dashboard and `/weather`. |
| OpenWeatherMap forecast (`api.openweathermap.org/data/2.5/forecast`) | Outbound, server-side only | **Live** (optional) | Used instead of Open-Meteo only when `OWM_API_KEY` is set in `.env`. |
| `GET /api/market/prices` | Our own route (the "market feed") | **Simulated** | Deterministic generator: the same crop + date always gives the same price. Returns all 9 catalog crops. |
| `GET /api/market/history?crop=EGGS_TRAY&days=90` | Our own route | **Simulated** | One crop's history, 1–90 days, oldest first. |
| MarketProvider with `MARKET_API_URL` | Outbound, server-side only | **Live, optional** | If the env var points at a real feed, the app fetches it and falls back to the simulated feed on any failure; the badge always shows the real source. |

Nothing external is ever called from the browser. The only key names are
`OWM_API_URL`-style env vars in `.env`; a grep of the production client
bundle (`.next/static`) finds no key names and no secrets.

## What is Live and what is Simulated

- **Live**: the weather (Open-Meteo by default) — badged "Live · updated
  just now" (green dot). If it fails, the last 30-minute snapshot is shown
  badged "Saved data" (amber clock); with no snapshot the card shows an
  error and a Retry, and everything else keeps working.
- **Simulated**: all market prices (badged "Simulated", blue flask) — a
  deterministic generator, not random, so demos and tests are repeatable.
  The market page says so in plain words.
- **Saved data**: the farmer's own logs and sales (eggs-per-day chart),
  badged "Saved data".

## How the two key numbers are calculated

Money is stored as **integer kobo** (₦1 = 100 kobo) and formatted only at
the screen edge.

**Estimated Market Value (egg stock value)**

```
stockEggs   = Σ eggs laid − Σ eggs sold            (per flock)
stockValue  = stockEggs ÷ 30 × latest tray price   (trays of 30)
```

**Daily profit**

```
revenue     = eggs today ÷ 30 × latest tray price
feedCost    = feedKg today × feed price per kg
profit      = revenue − feedCost                   (negative = "Loss", red)
```

The tray price is today's `EGGS_TRAY` price from the market feed; the feed
price per kg is the farmer's own number from Settings.

## Worked example (seeded demo data, 19 Oct 2026)

Demo farm: Port Harcourt farm, feed price **₦650/kg**, today's tray price
**₦4,162** per tray of 30 (Simulated feed).

Today's log across the farm's six flocks: **432 eggs**, **73.3 kg feed**.

```
revenue = 432 ÷ 30 × ₦4,162  = 14.4 trays × ₦4,162 = ₦59,932
feedCost = 73.3 kg × ₦650                          = ₦47,645
profit                                               = ₦12,287   ✅ shown on the dashboard
```

Stock value today: laid in the demo window **1,459** eggs, sold **270**
(Mango Creek 120 + 90, Creek Side 60), so

```
stockEggs  = 1,459 − 270 = 1,189 eggs
stockValue = 1,189 ÷ 30 × ₦4,162 ≈ ₦164,952         ✅ shown on the dashboard
```

A loss day exists on purpose: **Harbour layers** laid 35 eggs on 18 Oct but
ate its usual 12.5 kg of feed — that day's profit is negative and shows red
with the word "Loss" on the profit chart, so the demo proves the app does
not only ever show good news.

All thresholds (laying rate 60 %, feed per hen 140 g, heat 34 °C) and base
prices are **samples** — a poultry expert must confirm them before real use.
This is stated in the app footer, on the market page and in the report.
