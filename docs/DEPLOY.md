# Deploying HenCount (Vercel + Neon)

`npm run build` passes on a fresh install: `package.json` has
`"postinstall": "prisma generate"`, so Vercel's install step generates the
Prisma client automatically. Nothing in the app depends on localhost — all
hosts work; cookies go `secure` automatically when `NODE_ENV=production`.

## 1. Environment variables (set these in Vercel → Settings → Environment
Variables — names exactly as written, values filled by you)

| Name | What to set |
|---|---|
| `DATABASE_URL` | The Neon Postgres connection string (use the **pooled** Neon URL for Vercel; keep `sslmode=require&connect_timeout=30`). |
| `SESSION_SECRET` | 32+ random bytes, base64. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. Different value from any other app. |
| `APP_TZ` | `Africa/Lagos` |
| `DEMO_MODE` | `true` for the judges (see below) |
| `OWM_API_KEY` | *(optional)* only if you have an OpenWeatherMap key; otherwise leave unset and Open-Meteo is used (no key needed) |
| `MARKET_API_URL` | *(optional)* only if you point the app at a real market feed; leave unset for the simulated feed |

Never commit these values. `.env` is git-ignored; `.env.example` carries
names only. The app refuses to start without `SESSION_SECRET` and
`DATABASE_URL`, with a plain-English message.

## 2. Build settings

- **Build command**: `npm run build` (Vercel's Next.js default is fine)
- **Install command**: `npm install` (the `postinstall` hook runs
  `prisma generate`)
- **Output**: Next.js default (no adapter needed)
- **Node version**: 18+

## 3. Database migrations (Neon)

Migrations live in `prisma/migrations/` and are applied with:

```bash
npx prisma migrate deploy
```

- Run it **once against the Neon database** before (or as a pre-build step
  of) the first deploy. On Vercel you can add it to the build command:
  `npx prisma migrate deploy && npm run build` — or run it locally against
  the same `DATABASE_URL`: `npm run db:deploy`.
- `prisma migrate dev` is for development only (it can reset); never use it
  on the hosted database.
- Seed the demo data once with `npm run db:seed` (safe to re-run; it is
  idempotent and slides its 7-day window to whatever "today" is).

## 4. DEMO_MODE for the judges

Set `DEMO_MODE=true` on the hosted site. It shows the **"Try demo
account"** button on the login page so a judge can enter without typing
anything, and it shows the heat-alert preview switch on the dashboard so
the alert banner can be demonstrated on a cool day. If you prefer judges to
create their own accounts, set it to `false` — the button disappears.

## 5. ⚠️ Change the demo password before hosting

The seeded demo account is `demo@hencount.test` with password `demo1234`
(documented in the README for local use). **On a public site, use a
stronger demo password**: pick something like a 12-character random word
combination, change it in `prisma/seed.ts` (the `DEMO.password` field),
re-run `npm run db:seed`, and update the README + demo script to match.
The hosted login form requires at least 8 characters, so anything shorter
will not work.

## 6. After the first deploy — smoke checks

- [ ] `/login` renders; wrong password shows one friendly sentence.
- [ ] "Try demo account" logs in (if `DEMO_MODE=true`).
- [ ] Dashboard weather card shows the **Live** badge — the Neon egress
      must be able to reach `api.open-meteo.com`.
- [ ] Market page shows today's prices (Simulated badge).
- [ ] `curl https://<your-domain>/api/market/prices` returns the JSON list.
- [ ] No key names in the client bundle: `grep -r "SESSION_SECRET\|DATABASE_URL\|OWM_API_KEY" .next/static/` → nothing.
