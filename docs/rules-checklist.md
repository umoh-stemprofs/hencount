# Rules checklist — Agriculture (00-global.md §1)

Every line of the Agriculture rules, proven with where it lives in HenCount.
Checked in the browser against the running app on 19 Oct 2026 (dev and
production build). Anything not met is marked **MISSING**.

| Rule (00-global.md §1) | Where it is in the app | Status |
|---|---|---|
| Prices for at least 3 crops from an API or a simulated live feed | Market page (`/market`): the egg tray price card plus the "Other crops, same market feed" cards — **Maize ₦601/kg, Tomato ₦719/kg, Cassava ₦339/kg** (same deterministic feed, each with a change % and a Simulated badge). `GET /api/market/prices` returns all 9 catalog crops. | ✅ Met |
| Weather forecast for the farm's own coordinates, from a weather API | Weather page (`/weather`) and the dashboard weather card. Coordinates come from the farm row (Settings → "Your farm's coordinates drive the weather"); the page prints them ("Judge Farm · 4.8156, 7.0498") with a "Change location" link. Source: Open-Meteo, called server-side. | ✅ Met |
| Inventory + "Estimated Market Value" of stock from current prices | Egg stock in hand on each flock card (`/eggs`) and the sell page ("90 eggs · Worth ₦12,486 at today's tray price"); the dashboard "Stock value" card totals the farm (1,189 eggs → ₦164,952 in the demo). Formula: stock ÷ 30 × today's tray price. | ✅ Met |
| At least one external fetch that works, shown on screen | Live Open-Meteo call to `api.open-meteo.com` for the farm's coordinates; the card is badged **"Live · updated just now"**. Visible on the dashboard and `/weather`; the Network tab shows the server-side request during the page render. | ✅ Met |
| Line, bar or pie charts for inventory and market trends | **Line**: market price history (7/30/90-day toggle) and profit-per-day on advice. **Bar**: eggs per day with the 60 % line (dashboard and advice). **Pie**: share of egg stock value by flock (max 5 slices + "Other"). Every chart has "View as table". | ✅ Met |
| Responsive (phone to desktop) | `app/(app)/layout.tsx`: ≥1024 px fixed 240 px sidebar; under that a sticky top bar plus a fixed 4-item bottom nav. Charts, tables and forms collapse to one column (`sm:`/`lg:` breakpoints throughout). | ✅ Met |
| API keys in environment variables only | `OWM_API_KEY`, `MARKET_API_URL`, `DATABASE_URL`, `SESSION_SECRET` are read only on the server from `.env` (git-ignored; `.env.example` committed with names only). Proof: `grep -r -E "DATABASE_URL\|SESSION_SECRET\|OWM_API_KEY\|MARKET_API_URL\|DEMO_MODE" .next/static/` → **no matches**; the demo password is not in the bundle either. | ✅ Met |
| Every data block labeled Live, Saved data or Simulated | `<DataSourceBadge>` on every price, weather and chart card: weather "Live · updated just now" (green dot), a stale snapshot would show "Saved data · 3 h old" (amber clock), all market/price cards show "Simulated" (blue flask). Seen on dashboard, market, advice, sell and eggs pages. | ✅ Met |
| Disclaimer: "Decision-support tool. You decide." | Footer on **every** page (`app/(app)/layout.tsx` and the login/signup pages), plus the second line about simulated prices and sample thresholds. | ✅ Met |

## Extra checks from 00-global §3 (AGRO base)

| Requirement | Where | Status |
|---|---|---|
| Dashboard shell: stat cards, weather card, price card, line + bar/pie chart, alerts banner | Dashboard `/`: Today's eggs, Stock value, Profit today + egg tray price cards; weather card; eggs bar chart + stock-value pie; `HeatBanner` alert (real when a hot day is forecast, preview switch in `DEMO_MODE`). | ✅ Met |
| Market routes `/api/market/prices` and `/api/market/history?crop=&days=` (max 90) | `app/api/market/prices/route.ts`, `app/api/market/history/route.ts`; Zod-validated query, 400 with one sentence on bad input. | ✅ Met |
| Deterministic generator, same date → same price; salt invariant (some crop rising and one falling) | `lib/market/generator.ts` + `generator.test.ts` scans every day of 2026–2027 for the rising/falling invariant. | ✅ Met |
| MarketProvider adapter, LiveProvider fallback to Simulated | `lib/market/provider.ts`; badge always shows the real source. | ✅ Met |
| Weather: 5 s timeout, one retry, Zod-validated, cached 30 min in WeatherSnapshot, error card that never takes the rest of the page down | `lib/weather/http.ts`, `schemas.ts`, `load.ts`, `store.ts`; error state shows "Weather is unavailable right now…" + Try again. | ✅ Met |
| Money integer kobo, formatted "₦12,500" at the edge | Every money column is `Int` kobo; `formatNaira()` in `lib/dates.ts` is the only formatter. | ✅ Met |
| Dates YYYY-MM-DD in APP_TZ, never the server clock | `lib/dates.ts` (`todayInAppTz`, `APP_TZ = Africa/Lagos`); `@db.Date` columns. | ✅ Met |
| Zod on every server input | `lib/validation.ts` (auth, farm, day log, sale) + weather schemas + market history query. | ✅ Met |
| Pure logic in /lib with unit tests | `lib/eggs.ts`, `lib/dashboard.ts`, `lib/charts.ts`, `lib/alerts.ts` — 11 test files, 100+ assertions, no clock or DB in logic. | ✅ Met |
| bcrypt cost 10, httpOnly + sameSite=lax cookie, session + ownership re-checked in every action | `lib/auth.ts` (cost 10), `lib/session-config.ts` (httpOnly, lax, secure in prod), `middleware.ts` gate, and `lib/data.ts` `getFlockForUser`/`requireFarmForUser` ownership checks in every action. | ✅ Met |
| Advice per docs/03-hencount.md (4 states + rules order) | `adviceFor()` in `lib/eggs.ts`; demo seed shows all of them: Mango Creek "Laying well", Palm Grove "Few eggs", Creek Side "Too much feed", Point of lay "Keep adding" — each verified in the browser. | ✅ Met |
| Cannot sell more than stock; saving the same day again overwrites | `validateEggSale()` ("You cannot sell more eggs than you have in stock.") and `DayLog` unique (flockId, date) — both verified in the click-through. | ✅ Met |
| Sample numbers marked as placeholders | Market page, advice page, weather page and the footer all say sample thresholds/prices need an expert's review. | ✅ Met |

## Nothing missing

No rule in section 1 is MISSING. The one place HenCount reads the rules
loosely: the dashboard shows **three** stat cards plus the egg tray price
card (the fourth card on the first screen) rather than four number cards —
docs/03-hencount.md page 2 defines exactly these three for HenCount, and the
price card carries the market number.
