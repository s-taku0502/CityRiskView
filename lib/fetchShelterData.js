// /lib/fetchShelterData.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * 指定避難所＋指定緊急避難場所を統合して返す
 * @param {string} prefCode 都道府県コード（13など）
 */
export async function getUnifiedShelterData(prefCode) {
  const { data: shelters, error: sError } = await supabase
    .from("shelters")
    .select("*")
    .eq("pref_code", prefCode);

  const { data: emergency, error: eError } = await supabase
    .from("emergency_sites")
    .select("*")
    .eq("pref_code", prefCode);

  if (sError || eError) {
    console.error("Error fetching data:", sError || eError);
    return [];
  }

  // 統一形式で統合
  const unified = [
    ...(shelters || []).map((s) => ({
      ...s,
      type: "指定避難所",
    })),
    ...(emergency || []).map((e) => ({
      ...e,
      type: "指定緊急避難場所",
    })),
  ];

  return unified;
}
