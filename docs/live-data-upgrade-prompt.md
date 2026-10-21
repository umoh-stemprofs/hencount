# Prompt: replace HenCount's simulated market prices with real live Nigerian data

Work in `stem2026/hencount`. Replace the simulated market-price feed with real,
live Nigerian market prices from HDX HAPI, and add the missing Open-Meteo
attribution. Weather is already live — do not rewrite it.

## Verified facts (I probed the API directly — trust these, but re-verify)

**Endpoint**

```
https://hapi.humdata.org/api/v2/food-security-nutrition-poverty/food-prices-market-monitor
```

Auth: `app_identifier` as a query param or `X-HDX-HAPI-APP-IDENTIFIER` header.
It is base64 of `app_name:email`, e.g. base64("hen-count:team@example.com").
No account or signup needed. Not a secret, but still read it from env.

Params: `location_code=NGA`, `commodity_name=Eggs`, `start_date`, `end_date`
(ISO `YYYY-MM-DD`), `limit` (max 10000), `offset`.

Response shape: `{ "data": [ { location_code, admin1_name, market_name,
commodity_name, currency_code, unit, price_flag, price_type, price, lat, lon,
reference_period_start, reference_period_end, resource_hdx_id } ] }`

**Real response I verified for eggs**

```json
{
  "location_code": "NGA", "admin1_name": "Borno", "market_name": "Damassack (CBM)",
  "commodity_name": "Eggs", "currency_code": "NGN", "unit": "30 pcs",
  "price_flag": "aggregate", "price_type": "Retail", "price": 2400.0,
  "reference_period_start": "2023-06-15T00:00:00",
  "reference_period_end": "2023-07-14T23:59:59"
}
```

- Egg unit is `30 pcs` — a **1:1 match** with `Crop.EGGS_TRAY` / `Unit.TRAY`.
- Currency is always `NGN`.
- Data is **monthly**, not daily. Periods run ~15th of one month to the 14th of
  the next. As of Oct 2026 the current period is `2026-10-15` → `2026-11-14`,
  which **covers today**. Egg prices are ₦6,000–6,500 per tray across 9 markets.
- Update cadence is weekly for a monthly-frequency dataset.

**Commodity coverage I probed (all NGN)**

| HenCount crop | HAPI commodity | Current? | Unit handling |
|---|---|---|---|
| `EGGS_TRAY` | `Eggs` | ✅ to 2026-11-14 | `30 pcs` → tray, direct |
| `YAM` | `Yam` | ✅ | mixed `2.5 KG` / `100 KG` / `100 Tubers` |
| `TOMATO` | `Tomatoes` | ✅ | `0.5 KG` → ₦/kg, ×2 |
| `RICE_PADDY` | `Rice (local)` | ✅ | mixed `KG` / `2.7 KG` / `100 KG` |
| `MAIZE` | `Maize (white)`/`(yellow)` | ❌ **stale, last 2023-02-14** | — |
| `CASSAVA` | `Cassava meal (gari, yellow)` | ❌ stale 2023-02-14 | — |
| `TILAPIA` | none | ❌ no data | — |
| `CATFISH` | none | ❌ no data | — |
| `PALM_OIL` | none | ❌ no data | — |

Also current but **not in the catalog**: `Onions`, `Beans (red)`, `Beans (white)`,
`Maize flour`. Do not add new crops — that means a Prisma `Crop` migration and
new seed rows, which is out of scope.

**No free API anywhere provides Nigerian poultry-feed (layers mash) prices.**
The feed price stays user-entered in Settings. Do not derive it from maize —
that would require inventing an ingredient coefficient an expert has not
approved.

## Decisions already made (do not relitigate)

1. **Chart granularity.** Today's price, stock value and profit-per-day use the
   latest real observation (genuinely the current period). The history chart
   plots **actual observations at their real dates with gaps** — never
   interpolate or carry a value across days. Widen the window so there are
   enough points (e.g. up to ~12 months / ~12 points) instead of forcing the
   7/30/90-**day** toggle to produce daily points it does not have.
2. **Crop scope.** `EGGS_TRAY` plus whichever of YAM / TOMATO / RICE_PADDY have
   current data. The other five stay on the simulated feed, badged `Simulated`.
3. **Feed price** stays user-entered.

## What to build

### 1. `lib/market/hdx.ts` — a new `HdxProvider implements MarketProvider`

Follow the shape of the existing `SimulatedProvider` and `LiveProvider` in
`lib/market/provider.ts`. Add a third `MarketProvider` source value so the badge
can tell the truth about where a number came from.

- **Period selection.** A row is "current" if
  `reference_period_start <= today <= reference_period_end`. Pick the newest
  such period. If the newest observation is older than ~45 days, the data is
  stale — surface that rather than presenting it as today's price.
- **Market aggregation.** Several markets report the same commodity for the
  same period. Take the **median** across markets (robust to outliers), and
  keep the market count for the badge detail ("9 markets").
- **Unit normalisation — reject, never guess.** Accept only units that convert
  exactly to the catalog unit. Parse a `"N UNIT"` pattern:
  - `30 pcs` → `TRAY`, direct
  - `KG` → per kg, direct
  - `0.5 KG` → ₦/kg = price × 2
  - `2.5 KG` → ₦/kg = price ÷ 2.5
  - `100 KG` / `50 KG` → ₦/kg = price ÷ 100 / ÷ 50
  - **`100 Tubers` → reject.** There is no weight per tuber; converting it
    would be inventing a number.
  Any unrecognised unit string is dropped for that market, not coerced.
- **Money.** HAPI returns naira as a float. Convert to **integer kobo** with
  `Math.round(price * 100)`. Integer kobo everywhere is an app-wide rule.
- **History.** `getHistory(crop, days)` currently promises daily ticks ending
  today. With real data it returns only dates that actually have an
  observation, oldest first, fewer than `days` entries. Returning an empty
  array is a valid, expected outcome — the pages already have empty states for
  it.
- **Provenance.** Carry enough to render an honest badge: source, the
  observation period (`YYYY-MM-DD` of `reference_period_end`), the market
  count, and the HAPI `resource_hdx_id`. This is transient metadata —
  `PriceTick` has no columns for it and `persist()` must not try to write it.

### 2. Caching and persistence

- Cache the HAPI fetch aggressively (the underlying data is monthly; a 6–24 h
  TTL is right). A module-level TTL cache is enough — do not hammer the API on
  every page render.
- Reuse the existing `persist()` in `lib/market/provider.ts` to write real
  ticks into `PriceTick` with `source: "LIVE"`. That gives you a durable
  fallback and keeps the DB mirroring the feed, which the rules checklist
  already documents.
- On any fetch/parse failure, fall back to `SimulatedProvider` exactly as
  `LiveProvider` does today, and log a warning. The badge must then read
  `Simulated` — never show a real badge on simulated numbers.

### 3. Provider precedence in `getMarketProvider()`

`MARKET_API_URL` (a custom feed) still wins if set. Otherwise use the HDX
provider when enabled, otherwise simulated. Keep the generic `LiveProvider`
working — it is documented in `docs/api.md`.

### 4. Badges: tell the truth about age

`components/DataSourceBadge.tsx` has `kind: "live" | "saved" | "simulated"` with
a `detail` prop. Use:

- `live` with detail like `WFP (HDX) · 9 markets · Oct 2026` when the
  observation period covers today.
- `saved` with the age when the newest observation is stale (> ~45 days).
- `simulated` when the live call failed and the generator answered.

Colour is never the only signal — icon + word is already correct, keep it.

### 5. Page updates

`DataSourceBadge kind="simulated"` is currently hard-coded on: the dashboard
price cards (`app/(app)/page.tsx`), `/market` (three places), the sell page,
the eggs list, `components/EggPriceCard.tsx`, and the advice page. Each must
now reflect the provider's real source.

The market page shows a **day-over-day** change percentage. With monthly data
that comparison is meaningless — make it period-over-period (this period vs the
previous period), and say so in the label. If there is no previous period, hide
the change rather than showing a fabricated one.

### 6. Rice honesty check (make a call and state it)

The catalog calls `RICE_PADDY` "Rice paddy" — that is **unmilled paddy rice**.
HAPI's `Rice (local)` is **milled consumer rice**. These are different products
at different prices. Either relabel the catalog entry to reflect what the
number actually is (the label is a UI string in `lib/market/catalog.ts`), or
leave `RICE_PADDY` on the simulated feed. Do not silently price paddy with
milled-rice numbers.

### 7. Open-Meteo attribution (licence requirement, currently missing)

The free tier is non-commercial-only and requires CC BY 4.0 attribution. Add a
linked line — `"Weather data by Open-Meteo.com"` → `https://open-meteo.com/` —
next to the footer disclaimer in `app/(app)/layout.tsx` (and the login/signup
pages), and near the weather card. Do not change the Open-Meteo integration
itself; it is already correct.

### 8. Config, docs and copy

- `.env.example`: add the identifier env var (names only, no values). Suggest
  `HDX_HAPI_APP_IDENTIFIER`.
- `docs/api.md`: document the HAPI call, params, response shape, caching, the
  fallback chain, and the unit-normalisation rules. Add a note that the data is
  monthly-frequency.
- The footer currently says *"Prices are a simulated live feed (deterministic
  sample data)."* Update it to describe the real arrangement — live prices
  where Nigerian data exists, simulated where it does not, sample thresholds
  still needing expert review.
- Update `README.md` and re-check `docs/rules-checklist.md`. The rule
  *"Prices for at least 3 crops from an API"* becomes genuinely met by a real
  API; the rule *"Every data block labeled Live, Saved data or Simulated"*
  must still hold everywhere.

## Constraints (app-wide rules — 00-global.md)

- Money is **integer kobo**; `formatNaira()` in `lib/dates.ts` is the only
  formatter.
- Dates are `YYYY-MM-DD` in `APP_TZ` (`Africa/Lagos`), from `lib/dates.ts` —
  never the server clock. `reference_period_*` values arrive as ISO datetimes
  and must be converted into `APP_TZ` before comparing to "today".
- Zod-validate the HAPI response like `lib/weather/schemas.ts` does. An
  unexpected shape is a failure that falls back, never a crash.
- Server-side only. No external call from the browser, ever.
- Bad input → one sentence saying what to fix, never a stack trace.
- **Never invent a number.** Missing data shows a gap or an empty state.

## Tests (pure logic, no network, no DB)

Add tests in the existing `lib/**/*.test.ts` style (vitest, `server-only`
stubbed by `vitest.config.ts`):

- Unit parser: every accepted unit converts correctly; `100 Tubers` and any
  unknown string are rejected, not coerced.
- Naira → integer kobo, including rounding.
- Median-across-markets, including an outlier market.
- "Current period" selection: a period covering today wins; an old period is
  detected as stale.
- Provider fallback: a mocked fetch failure returns simulated ticks and the
  source reads `SIMULATED`.
- History returns only real observation dates, and an empty array when there
  are none.

Existing tests must keep passing.

## Verify before claiming done

1. `npm run tsc`, `npm run test`, `npm run lint`, `npm run scan:invariants`,
   `npm run build` — all clean.
2. **Test the real thing, not the build.** Start the dev server and confirm the
   egg price on `/market` matches a live `curl` of the HAPI endpoint. A green
   typecheck does not prove the integration works.
3. Badges: confirm `Live` on `/market`, `/eggs`, the sell page, the dashboard
   and advice; confirm a `Simulated` badge appears when the endpoint is
   unreachable (break the URL deliberately and check).
4. Charts: confirm the price-history chart shows discrete real points with
   gaps, and that "View as table" matches.
5. Confirm the Open-Meteo attribution renders on every page.
6. Re-verify the API with `curl` if anything about the response seems off —
   do not debug against an assumption.
