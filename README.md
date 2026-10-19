# HenCount — eggs, feed and profit

Agriculture track (STEM Festival 2026). A daily egg and feed log for a
small poultry farmer: laying rate, feed per hen and daily profit per
flock, with the egg stock in hand valued at today's market tray price.
Accent: #9A5B00.

## Stack

Next.js 14 (App Router, TypeScript) · Tailwind · Prisma + hosted Neon
Postgres · Zod · iron-session · bcryptjs · Recharts · Vitest

## Setup

```bash
npm install                        # postinstall runs `prisma generate`
cp .env.example .env               # then fill in DATABASE_URL + SESSION_SECRET
npm run db:migrate                 # create tables (first run only)
npm run db:seed                    # demo data (idempotent)
npm run dev                        # http://localhost:3001
```

Production check: `npm run build && npm start` — also on port **3001**.

## Environment variables (.env, git-ignored)

| Name | Required | Meaning |
|---|---|---|
| `DATABASE_URL` | yes | Hosted Neon Postgres connection string. Never commit it; never print it. |
| `SESSION_SECRET` | yes | iron-session cookie key: 32 random bytes, base64. `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `APP_TZ` | yes | Always `Africa/Lagos`. All dates use this zone, not the server's. |
| `DEMO_MODE` | no | `true` shows the "Try demo account" button on the login page. |
| `OWM_API_KEY` | no | OpenWeatherMap key. Without it, Open-Meteo (no key) is used. |
| `MARKET_API_URL` | no | A real market feed base URL. Without it, the simulated feed is used. |

`.env.example` carries the names and format only. Hosted setup:
[docs/DEPLOY.md](docs/DEPLOY.md).

## Demo account (seeded)

- Email: `demo@hencount.test`
- Password: `demo1234`

("Try demo account" on the login page logs in directly when
`DEMO_MODE=true`.) The seed has one flock per advice state — Mango Creek
layers (Laying well), Palm Grove layers (Few eggs), Creek Side layers
(Too much feed), Point of lay pullets (Keep adding) — plus Harbour layers
with a deliberate loss day and the small Kitchen coop for the pie chart's
"Other" slice. Re-running the seed slides its 7-day window to whatever
today is.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | dev server on port **3001** |
| `npm run build` / `npm start` | production build / server, port **3001** |
| `npm run typecheck` | TypeScript check |
| `npm test` | Vitest unit tests (pure logic, no database or network) |
| `npm run db:migrate` | create/apply migrations (dev) |
| `npm run db:deploy` | apply committed migrations (`prisma migrate deploy`) |
| `npm run db:seed` | seed demo data (idempotent) |
| `npm run db:studio` | Prisma Studio |
| `npx tsx scripts/timing.ts [runs] [port]` | page timing harness (needs a seeded demo account) |

## Data honesty

- **Weather is live**: a real server-side call to Open-Meteo for the
  farm's own coordinates, cached 30 minutes, badged "Live" (or
  "Saved data" when serving the fallback).
- **Market prices are a simulated live feed** (deterministic generator —
  the same date always gives the same price), badged "Simulated", with a
  `MARKET_API_URL` switch for a real feed.
- Sample numbers (thresholds, base prices) are **placeholders** — a
  poultry expert must review them before real use. The app says this on
  every page footer.

Decision-support tool. You decide.
