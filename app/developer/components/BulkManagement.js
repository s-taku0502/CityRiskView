'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { supabase } from '@/lib/supabase';
import { separatedPrefectures } from '@/app/utils/prefectures';

// テーブル名を取得するヘルパー
function getTableName(tableType, selectedPrefecture) {
  // 都道府県情報を検索
  const pref = separatedPrefectures.find((p) => p.name === selectedPrefecture);

  // デフォルト fallback（都道府県が未選択または見つからない場合）
  if (!pref) {
    console.warn(`未対応の都道府県: ${selectedPrefecture}`);
    return tableType === 'designated_shelters'
      ? 'shelters_unknown'
      : 'emergency_shelters_unknown';
  }

  // pref.code = "02" のような文字列を利用してテーブル名を作成
  return tableType === 'designated_shelters'
    ? `shelters_pref${pref.code}`           // 例: shelters_pref02
    : `emergency_shelters_pref${pref.code}`; // 例: emergency_shelters_pref02
}

export default function BulkManagement() {
  const [tableType, setTableType] = useState('designated_shelters');
  const [selectedPref, setSelectedPref] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [status, setStatus] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!csvFile || !selectedPref) {
      setStatus('CSVファイルと都道府県を指定してください。');
      return;
    }

    // getTableName を使ってテーブル名を決定
    const tableName = getTableName(tableType, selectedPref);

    setStatus('CSV解析中...');

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        const data = result.data.map((row) => {
          if (tableType === 'designated_shelters') {
            return {
              pref_name: selectedPref,
              common_id: row['共通ID'] || null,
              name: row['施設・場所名'] || null,
              address: row['住所'] || null,
              same_location: row['指定緊急避難場所との住所同一'] || null,
              other_notes: row['その他市町村長が必要と認める事項'] || null,
              target_people: row['受入対象者'] || null,
              latitude: row['緯度'] ? parseFloat(row['緯度']) : null,
              longitude: row['経度'] ? parseFloat(row['経度']) : null,
              remarks: row['備考'] || null,
            };
          } else {
            return {
              pref_name: selectedPref,
              common_id: row['共通ID'] || null,
              name: row['施設・場所名'] || null,
              address: row['住所'] || null,
              flood: row['洪水'] || null,
              landslide: row['崖崩れ、土石流及び地滑り'] || null,
              high_tide: row['高潮'] || null,
              earthquake: row['地震'] || null,
              tsunami: row['津波'] || null,
              large_fire: row['大規模な火事'] || null,
              inland_flood: row['内水氾濫'] || null,
              volcano: row['火山現象'] || null,
              same_location: row['指定避難所との住所同一'] || null,
              latitude: row['緯度'] ? parseFloat(row['緯度']) : null,
              longitude: row['経度'] ? parseFloat(row['経度']) : null,
              remarks: row['備考'] || null,
            };
          }
        });

        setStatus(`Supabaseに ${data.length} 件のデータを送信中...`);

        const { error } = await supabase.from(tableName).insert(data);

        if (error) {
          console.error(error);
          setStatus(`エラーが発生しました: ${error.message}`);
        } else {
          setStatus(`${data.length} 件のデータを ${tableName} に登録しました。`);
        }
      },
    });
  };

  return (
    <main className="p-6 max-w-2xl mx-auto text-center">
      <h1 className="text-xl font-bold mb-4">避難所・緊急避難場所 一括管理ツール</h1>

      <div className="space-y-4">
        {/* 対象データの選択 */}
        <div>
          <label className="font-semibold">対象データ：</label>
          <select
            value={tableType}
            onChange={(e) => setTableType(e.target.value)}
            className="border rounded p-2 ml-2"
          >
            <option value="designated_shelters">指定避難所</option>
            <option value="emergency_shelters">指定緊急避難場所</option>
          </select>
        </div>

        {/* 都道府県プルダウン */}
        <div>
          <label className="font-semibold">都道府県名：</label>
          <select
            value={selectedPref}
            onChange={(e) => setSelectedPref(e.target.value)}
            className="border rounded p-2 ml-2"
          >
            <option value="">選択してください</option>
            {separatedPrefectures.map((pref) => (
              <option key={pref.code} value={pref.name}>
                {pref.name}
              </option>
            ))}
          </select>
        </div>

        {/* CSVファイル選択 */}
        <div>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="p-2"
          />
        </div>

        {/* アップロードボタン */}
        <button
          onClick={handleUpload}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          CSVをアップロード
        </button>

        {status && <p className="mt-4">{status}</p>}
      </div>
    </main>
  );
}
