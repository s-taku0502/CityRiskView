// /app/api/shelters/route.js
import { NextResponse } from "next/server";
import { getUnifiedShelterData } from "@/lib/fetchShelterData";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const DEFAULT_PREF_CODE = "13"; // デフォルト: 東京
  const prefCode = searchParams.get("pref") || DEFAULT_PREF_CODE;
  const data = await getUnifiedShelterData(prefCode);
  return NextResponse.json({ count: data.length, data });
}
