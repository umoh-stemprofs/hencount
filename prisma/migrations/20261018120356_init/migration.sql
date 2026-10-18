-- CreateEnum
CREATE TYPE "Crop" AS ENUM ('MAIZE', 'CASSAVA', 'YAM', 'RICE_PADDY', 'TOMATO', 'TILAPIA', 'CATFISH', 'EGGS_TRAY', 'PALM_OIL');

-- CreateEnum
CREATE TYPE "Unit" AS ENUM ('KG', 'TRAY', 'LITRE');

-- CreateEnum
CREATE TYPE "PriceSource" AS ENUM ('SIMULATED', 'LIVE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passHash" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farms" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "farms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_ticks" (
    "id" TEXT NOT NULL,
    "crop" "Crop" NOT NULL,
    "date" DATE NOT NULL,
    "priceKobo" INTEGER NOT NULL,
    "unit" "Unit" NOT NULL,
    "source" "PriceSource" NOT NULL DEFAULT 'SIMULATED',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_ticks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weather_snapshots" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "fetchedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "weather_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flocks" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "day_logs" (
    "id" TEXT NOT NULL,
    "flockId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "hens" INTEGER NOT NULL,
    "eggs" INTEGER NOT NULL,
    "feedKg" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "day_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "egg_sales" (
    "id" TEXT NOT NULL,
    "flockId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "eggs" INTEGER NOT NULL,
    "pricePerTrayKobo" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "egg_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_prices" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "priceKobo" INTEGER NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "feed_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "farms_userId_idx" ON "farms"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "price_ticks_crop_date_key" ON "price_ticks"("crop", "date");

-- CreateIndex
CREATE INDEX "weather_snapshots_farmId_fetchedAt_idx" ON "weather_snapshots"("farmId", "fetchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "flocks_farmId_name_key" ON "flocks"("farmId", "name");

-- CreateIndex
CREATE INDEX "day_logs_flockId_date_idx" ON "day_logs"("flockId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "day_logs_flockId_date_key" ON "day_logs"("flockId", "date");

-- CreateIndex
CREATE INDEX "egg_sales_flockId_date_idx" ON "egg_sales"("flockId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "feed_prices_farmId_key" ON "feed_prices"("farmId");

-- AddForeignKey
ALTER TABLE "farms" ADD CONSTRAINT "farms_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weather_snapshots" ADD CONSTRAINT "weather_snapshots_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flocks" ADD CONSTRAINT "flocks_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "day_logs" ADD CONSTRAINT "day_logs_flockId_fkey" FOREIGN KEY ("flockId") REFERENCES "flocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "egg_sales" ADD CONSTRAINT "egg_sales_flockId_fkey" FOREIGN KEY ("flockId") REFERENCES "flocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_prices" ADD CONSTRAINT "feed_prices_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Range rules (docs/00-global.md §3, docs/03-hencount.md) enforced at the
-- database level too, so a bad row cannot be written even by a script.
ALTER TABLE "day_logs" ADD CONSTRAINT "day_logs_hens_min" CHECK ("hens" >= 1);
ALTER TABLE "day_logs" ADD CONSTRAINT "day_logs_eggs_min" CHECK ("eggs" >= 0);
ALTER TABLE "day_logs" ADD CONSTRAINT "day_logs_feedKg_positive" CHECK ("feedKg" > 0);
ALTER TABLE "egg_sales" ADD CONSTRAINT "egg_sales_eggs_positive" CHECK ("eggs" > 0);
ALTER TABLE "egg_sales" ADD CONSTRAINT "egg_sales_priceKobo_positive" CHECK ("pricePerTrayKobo" > 0);
ALTER TABLE "feed_prices" ADD CONSTRAINT "feed_prices_priceKobo_positive" CHECK ("priceKobo" > 0);
ALTER TABLE "price_ticks" ADD CONSTRAINT "price_ticks_priceKobo_positive" CHECK ("priceKobo" > 0);
ALTER TABLE "farms" ADD CONSTRAINT "farms_lat_range" CHECK ("lat" >= -90 AND "lat" <= 90);
ALTER TABLE "farms" ADD CONSTRAINT "farms_lon_range" CHECK ("lon" >= -180 AND "lon" <= 180);
