// /app/api/shelters/route.js
import { NextResponse } from "next/server";
import { getUnifiedShelterData } from "@/lib/fetchShelterData";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const prefCode = searchParams.get("pref") || "13"; // デフォルト: 東京
  const data = await getUnifiedShelterData(prefCode);
  return NextResponse.json({ count: data.length, data });
}
