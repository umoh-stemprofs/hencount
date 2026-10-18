// GET /api/market/prices — latest price of every crop in the catalog.
// Simulated by default; LiveProvider when MARKET_API_URL is set (falls back
// to simulated on failure). Items: {crop, date, priceKobo, unit, source}.
import { NextResponse } from "next/server";
import { getMarketProvider } from "@/lib/market/provider";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const provider = getMarketProvider();
    const prices = await provider.getLatest();
    return NextResponse.json(prices, {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    console.error("/api/market/prices failed:", error);
    return NextResponse.json(
      { error: "Prices are unavailable right now. Try again in a few minutes." },
      { status: 500 },
    );
  }
}
