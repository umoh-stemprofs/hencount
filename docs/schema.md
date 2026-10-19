# Database schema — HenCount

Postgres (Neon), managed with Prisma (`prisma/schema.prisma`). Money is
always **integer kobo** (₦1 = 100 kobo). Calendar days are `@db.Date`
(stored at UTC midnight, meaning a day in `APP_TZ` = Africa/Lagos);
timestamps are `timestamptz`. Range rules (hens ≥ 1, eggs ≥ 0, feedKg > 0,
sale eggs > 0) are CHECK constraints in the migration, so a bad row cannot
be written even by a script.

## Tables

### `users` — one farmer
`id` (cuid PK) · `email` (unique) · `name` · `passHash` (bcrypt, cost 10) ·
`createdAt`. Has many `farms`.

### `farms` — one farm per user (the ownership boundary)
`id` (PK) · `userId` (FK → users, cascade delete) · `name` · `lat` · `lon` ·
`currency` (default "NGN") · `createdAt`. Owns `flocks`, `feedPrices` and
`weather_snapshots`; every read in the app is scoped through `userId`.

### `price_ticks` — one price for one crop on one calendar day
`id` (PK) · `crop` (enum Crop: MAIZE, CASSAVA, YAM, RICE_PADDY, TOMATO,
TILAPIA, CATFISH, EGGS_TRAY, PALM_OIL) · `date` (@db.Date) · `priceKobo`
(Int) · `unit` (enum Unit: KG, TRAY, LITRE) · `source` (enum PriceSource:
SIMULATED, LIVE) · `createdAt`. **unique(crop, date)** makes the simulated
feed safe to re-run for the same day.

### `weather_snapshots` — cached weather, so a failed call can still show data
`id` (PK) · `farmId` (FK → farms, cascade) · `fetchedAt` · `source`
("OPEN_METEO" or "OWM") · `payload` (Json, the validated forecast). Index
on `(farmId, fetchedAt)`; the loader reads the latest row within 30 minutes.

### `flocks` — one group of laying hens
`id` (PK) · `farmId` (FK → farms, cascade) · `name` · `createdAt`.
**unique(farmId, name)** — a farm cannot accidentally create two flocks
with the same name. Has many `day_logs` and `egg_sales`.

### `day_logs` — what happened with one flock on one day
`id` (PK) · `flockId` (FK → flocks, cascade) · `date` (@db.Date) · `hens`
(Int ≥ 1) · `eggs` (Int ≥ 0) · `feedKg` (Float > 0) · `createdAt`.
**unique(flockId, date)** — saving the same day again overwrites instead of
duplicating (the "add today twice" behaviour). Index on `(flockId, date)`.

### `egg_sales` — eggs sold on a day, at the price per tray they fetched
`id` (PK) · `flockId` (FK → flocks, cascade) · `date` (@db.Date) · `eggs`
(Int > 0) · `pricePerTrayKobo` (Int > 0) · `createdAt`. Index on
`(flockId, date)`. "Cannot sell more than stock" is a cross-row rule
(laid − sold), so it is enforced in `/lib/eggs.ts` on every write, not by a
CHECK.

### `feed_prices` — what a kg of feed costs on this farm
`id` (PK) · `farmId` (FK → farms, cascade, **unique** — one price per farm)
· `priceKobo` (Int) · `updatedAt`.

## Relations (picture)

```
users 1 ─── ∞ farms 1 ─── ∞ flocks 1 ─── ∞ day_logs
                 │              └─────── ∞ egg_sales
                 ├──────────── ∞ feed_prices
                 └──────────── ∞ weather_snapshots
(price_ticks stands alone — the market feed is not per-farm)
```

Deleting a farm cascades to its flocks, logs, sales, feed price and weather
snapshots; deleting a flock cascades to its logs and sales. Nothing in a
farmer's data can be reached without passing through their own `farms.userId`
check (`lib/data.ts`).
