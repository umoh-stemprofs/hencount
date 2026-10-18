# HenCount — eggs, feed and profit

Agriculture track (STEM Festival 2026). Daily egg and feed log with laying
rate, feed per hen and daily profit; egg stock in hand is valued at the
market tray price. Accent: #9A5B00.

## Stack

Next.js 14 (App Router, TypeScript) · Tailwind · Prisma + hosted Neon Postgres
· Zod · iron-session · bcryptjs · date-fns-tz · Recharts · Vitest

## Setup

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URL
npx prisma migrate dev # create tables (first run)
npm run db:seed        # demo data
npm run dev            # http://localhost:3001
```

## Environment variables (.env, git-ignored)

| Name | Meaning |
|---|---|
| `DATABASE_URL` | Hosted Neon Postgres connection string. Never commit it. |
| `APP_TZ` | Always `Africa/Lagos`. Dates and times use this zone, not the server's. |
| `OWM_API_KEY` | (step 2) Optional OpenWeatherMap key. Without it, Open-Meteo is used. |
| `MARKET_API_URL` | (step 2) Optional live market feed. Without it, the simulated feed is used. |

## Demo account (seeded)

- Email: `demo@hencount.test`
- Password: `demo1234`

One flock per advice state: Mango Creek layers (good), Palm Grove layers
(few eggs), Creek Side layers (too much feed), Point of lay pullets
(keep adding — only 2 days of logs).

## Commands

- `npm run dev` — dev server on port **3001**
- `npm run typecheck` — TypeScript check
- `npm run db:migrate` — create/apply migrations
- `npm run db:seed` — seed demo data (idempotent)
- `npm run db:studio` — Prisma Studio

## Data honesty

Market prices are a **simulated** live feed (deterministic generator, step 2).
Sample numbers (thresholds, prices) are placeholders — a poultry expert must
review them before any real use.
