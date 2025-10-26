// /lib/fetchShelterData.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * 指定避難所＋指定緊急避難場所を統合して返す
 * - 都道府県別テーブルを優先し、存在しなければ統合テーブルへフォールバック
 * @returns {Array} unified data
 */
export async function getUnifiedShelterData(prefCode) {
  if (!prefCode) return [];

  const pref = String(prefCode).padStart(2, "0");
  if (!/^\d{1,3}$/.test(pref)) {
    console.warn("getUnifiedShelterData: invalid prefCode", prefCode);
    return [];
  }

  async function tryTable(tableName, filterByPref = false) {
    console.debug(`[getUnifiedShelterData] try table: ${tableName} (filterByPref=${filterByPref})`);
    try {
      let query = supabase.from(tableName).select("*");
      if (filterByPref) query = query.eq("pref_code", pref);
      const res = await query;
      if (res.error) {
        console.debug(`[getUnifiedShelterData] table ${tableName} returned error:`, res.error.message || res.error);
        return null;
      }
      console.debug(`[getUnifiedShelterData] table ${tableName} returned ${Array.isArray(res.data) ? res.data.length : 'N/A'} rows`);
      return res.data || [];
    } catch (err) {
      console.debug(`[getUnifiedShelterData] table ${tableName} threw:`, err);
      return null;
    }
  }

  const shelterTable = `shelters_pref${pref}`;
  let shelters = await tryTable(shelterTable, false);
  let shelterSource = shelters ? shelterTable : null;
  if (!shelters) {
    shelters = (await tryTable("shelters", true)) || [];
    shelterSource = shelters.length ? "shelters" : shelterSource;
  }

  const emergencyTable = `emergency_shelters_pref${pref}`;
  let emergency = await tryTable(emergencyTable, false);
  let emergencySource = emergency ? emergencyTable : null;
  if (!emergency) {
    emergency = (await tryTable("emergency_shelters", true))
      || (await tryTable("emergency_sites", true))
      || [];
    emergencySource = emergency.length ? (emergencySource || "emergency_shelters/emergency_sites") : emergencySource;
  }

  console.info(`[getUnifiedShelterData] selected sources -> shelters: ${shelterSource || 'none'}, emergency: ${emergencySource || 'none'}`);

  const unified = [
    ...(shelters || []).map((s) => ({ ...s, type: "指定避難所" })),
    ...(emergency || []).map((e) => ({ ...e, type: "指定緊急避難場所" })),
  ];

  return unified;
}
