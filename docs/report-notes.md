# Report notes — HenCount (bullet notes for the 4–8 page report)

## Architecture (1 page)

- **Stack**: Next.js 14 App Router (TypeScript) · Tailwind · Prisma on
  hosted Neon Postgres · Zod · iron-session · bcryptjs · date-fns/Intl in
  `APP_TZ` · Recharts · Vitest.
- **Three layers**: (1) pure logic in `lib/` — `eggs.ts` (validation,
  metrics, advice, money, stock), `dashboard.ts`, `charts.ts`, `alerts.ts`,
  `market/generator.ts` — no clock, no DB, fully unit-tested; (2) server
  data access in `lib/data.ts` + `lib/market/provider.ts` +
  `lib/weather/load.ts`, every function ownership-checked; (3) pages in
  `app/` that only compose the two.
- **Adapters with fallbacks**: `MarketProvider` (Simulated default, Live
  when `MARKET_API_URL` is set, falls back on failure) and `WeatherProvider`
  (Open-Meteo default, OpenWeatherMap when `OWM_API_KEY` is set). The
  data-source badge always shows the real source — never wishful labels.
- **Deterministic simulated feed**: mulberry32 hash of crop+salt+day,
  random-walk with clamp, so the same date always gives the same price.
  Per-crop salts were searched so that **every day** of 2026–2027 has at
  least one rising and one falling crop (invariant test scans day by day).
- **Speed**: every page runs its independent calls in `Promise.all`
  (dashboard: farm + tray price in wave 1, then flocks + feed price +
  weather in wave 2; advice: feed price + 7-day price history together).
  Price persistence is one SELECT + one batched insert instead of 90
  upserts. Result: production warm 0.3–3 s per page (was 4–15 s).

## Security (1 page)

- **Passwords**: bcrypt cost 10, minimum 8 characters (Zod). Wrong email
  and wrong password give the same sentence — no account enumeration.
- **Sessions**: iron-session, httpOnly + sameSite=lax cookie
  (`hencount_session`), `secure` in production, 7-day TTL. The secret is
  `SESSION_SECRET` in `.env` only; the app refuses to boot without it.
- **Ownership**: `middleware.ts` is the first gate (everything except
  login/signup redirects). Every server action and page then re-checks:
  `requireFarmForUser` / `getFlockForUser` compare the row's farm owner to
  the session userId and throw `NotAuthorizedError`. A farmer can never
  read or write another farmer's flock — this is unit-tested with an
  injected fake DB (`lib/data.test.ts`).
- **Validation**: Zod on every server input (`lib/validation.ts`), plus
  DB-level CHECK constraints (hens ≥ 1, eggs ≥ 0, feedKg > 0, sale eggs > 0)
  so even a hand-written script cannot store an impossible row.
- **Env variables**: `DATABASE_URL`, `SESSION_SECRET`, `OWM_API_KEY`,
  `MARKET_API_URL`, `APP_TZ`, `DEMO_MODE` — all in `.env` (git-ignored);
  `.env.example` commits names only. Proof: grep of the built client
  bundle (`.next/static`) finds **no key names, no secrets, no demo
  password**. Nothing external is called from the browser.
- **Demo button**: "Try demo account" renders only when `DEMO_MODE=true`.

## Responsive design (½ page)

- `app/(app)/layout.tsx`: ≥1024 px — fixed 240 px sidebar + 12-column
  content grid, max width 1280. <1024 px — sticky top bar with
  settings/logout icons plus a fixed 4-item bottom nav (Dashboard, Eggs,
  Market, Weather), content padding leaves room for it (`pb-24`).
- Cards grid down to one column (`sm:`/`lg:` breakpoints); the market
  table and chart cards scroll/collapse; forms max 560 px.
- Touch targets ≥ 48 px (buttons h-12), body text 16 px, labels ≥ 14 px,
  tabular-nums for money, visible focus rings, aria labels on icon-only
  buttons, every chart has "View as table" for non-visual reading.
- Tested in the browser at desktop and phone widths during the click-through.

## How it helps a farmer earn more (½–1 page)

- Turns three daily numbers into two decisions: **is the flock paying its
  feed?** (profit per day, red "Loss" days visible) and **is the feed
  wasted?** (feed per hen in grams vs the 140 g sample threshold).
- The advice pill is one sentence a farmer can act on the same morning:
  "Few eggs. Check water, light and hen health." / "Too much feed. Give a
  little less." / "Laying well. Keep going."
- The egg stock in hand is priced at today's market tray price, so the
  farmer knows what is sitting in the crate **in naira**, and the sell
  form pre-fills today's market price — no arithmetic at the gate.
- Weather for the farm's own coordinates with a heat alert ("Hot day. Give
  cool water. Eggs may drop.") links the forecast to a concrete action.
- Worked numbers from the demo: 432 eggs + 73.3 kg feed → ₦12,287 profit
  today; the Harbour layers loss day shows how quickly profit vanishes when
  eggs drop but feed does not.

## Limits and what is simulated (½ page, honest)

- **Weather is the only live external call** (Open-Meteo, no key). It is
  cached 30 minutes; a failure shows the last snapshot ("Saved data") or a
  friendly error card — the rest of the app keeps working.
- **All market prices are a simulated live feed** (deterministic
  generator). It is shaped like a real API (our own `/api/market/*` routes,
  `MarketProvider` adapter, `MARKET_API_URL` switch) so a real feed can
  replace it without touching a page.
- **All thresholds and base prices are samples**: laying rate 60 %, feed
  per hen 140 g, heat 34 °C, and the ₦ base prices per crop. A poultry
  expert must review them before real use — stated in the app footer, on
  the market and advice pages.
- **One user = one farm** (the schema allows more, the UI shows the first).
  No offline mode, no multi-currency (NGN only), no email/SMS
  notifications — out of scope for this prototype.
- Demo data is seeded (`npm run db:seed`) and idempotent; it slides its
  7-day window forward on re-run so the demo works on any day.
- The app is a **decision-support tool** — it does not sell eggs, order
  feed, or contact buyers.
