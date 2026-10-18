// GET /api/market/history?crop=MAIZE&days=30 (days 1–90, default 30).
// Query is validated with Zod; bad input gets one sentence saying what to fix.
import { NextResponse } from "next/server";
import { Crop } from "@prisma/client";
import { z } from "zod";
import { getMarketProvider } from "@/lib/market/provider";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  crop: z.nativeEnum(Crop),
  days: z.coerce.number().int().min(1).max(90),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    crop: url.searchParams.get("crop") ?? undefined,
    days: url.searchParams.get("days") ?? "30",
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          "Unknown crop or days. Use crop=MAIZE (or another catalog crop) and days between 1 and 90.",
      },
      { status: 400 },
    );
  }

  try {
    const provider = getMarketProvider();
    const history = await provider.getHistory(parsed.data.crop, parsed.data.days);
    return NextResponse.json(history, {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    console.error("/api/market/history failed:", error);
    return NextResponse.json(
      { error: "Price history is unavailable right now. Try again in a few minutes." },
      { status: 500 },
    );
  }
}
