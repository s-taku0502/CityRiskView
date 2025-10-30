// /app/api/shelters/route.js
import { NextResponse } from "next/server";
import { getUnifiedShelterData } from "@/lib/fetchShelterData";
import { separatedPrefectures } from "../../utils/prefectures";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const DEFAULT_PREF_CODE = "13"; // デフォルト: 東京

    // クエリ名 'pref' を優先、なければ互換で 'code' を参照
    const raw = searchParams.get("pref") || searchParams.get("code") || DEFAULT_PREF_CODE;
    const prefCode = String(raw).padStart(2, "0");

    // 検証: allowed codes に含まれているか
    const allowed = new Set(separatedPrefectures.map((p) => p.code));
    if (!allowed.has(prefCode)) {
      return NextResponse.json({ error: "invalid prefecture code" }, { status: 400 });
    }

    const data = await getUnifiedShelterData(prefCode);
    const list = Array.isArray(data) ? data : [];

    return NextResponse.json({ count: list.length, data: list });
  } catch (e) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
