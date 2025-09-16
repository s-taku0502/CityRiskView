import React, { useState } from 'react';
import { parseShelterCsv } from '../../../src/utils/parseShelterCsv';

// Supabase側で登録したいカラム一覧（災害対応・バリアフリー等も追加）
const dbColumns = [
  { key: 'name', label: '名称' },
  { key: 'address', label: '住所' },
  { key: 'capacity', label: '収容人数' },
  { key: 'current_people', label: '現在の避難者数' },
  { key: 'latitude', label: '緯度' },
  { key: 'longitude', label: '経度' },
  { key: 'prefecture', label: '都道府県' },
  { key: 'city', label: '市区町村' },
  { key: 'flood', label: '洪水対応' },
  { key: 'landslide', label: '土砂災害対応' },
  { key: 'storm_surge', label: '高潮対応' },
  { key: 'earthquake', label: '地震対応' },
  { key: 'tsunami', label: '津波対応' },
  { key: 'large_fire', label: '大規模火災対応' },
  { key: 'inland_flood', label: '内水氾濫対応' },
  { key: 'volcano', label: '火山現象対応' },
  { key: 'barrier_free', label: 'バリアフリー' },
  { key: 'toilet_wheelchair', label: '車椅子対応トイレ' },
  { key: 'elevator', label: 'エレベーター有' },
  { key: 'slope', label: 'スロープ等' },
  { key: 'braille_block', label: '点字ブロック' },
  { key: 'first_floor_space', label: '避難スペースが1階' },
  { key: 'facility_area', label: '施設面積（㎡）' },
  { key: 'phone', label: '電話番号' },
  { key: 'email', label: 'メールアドレス' },
  { key: 'website', label: 'WebサイトURL' },
  { key: 'stock', label: '備蓄情報' },
  { key: 'note', label: '備考・その他' },
];

// 自動マッピング候補
const autoMap = [
  { db: 'name', csv: ['施設・場所名', '名称'] },
  { db: 'address', csv: ['住所'] },
  { db: 'capacity', csv: ['収容人数'] },
  { db: 'current_people', csv: ['現在の避難者数'] },
  { db: 'latitude', csv: ['緯度'] },
  { db: 'longitude', csv: ['経度'] },
  { db: 'prefecture', csv: ['都道府県', '都道府県名及び市町村名'] },
  { db: 'city', csv: ['市区町村', '都道府県名及び市町村名'] },
  { db: 'flood', csv: ['洪水', '洪水対応'] },
  { db: 'landslide', csv: ['崖崩れ、土石流及び地滑り', '土砂災害対応'] },
  { db: 'storm_surge', csv: ['高潮', '高潮対応'] },
  { db: 'earthquake', csv: ['地震', '地震対応'] },
  { db: 'tsunami', csv: ['津波', '津波対応'] },
  { db: 'large_fire', csv: ['大規模な火事', '大規模火災対応'] },
  { db: 'inland_flood', csv: ['内水氾濫', '内水氾濫対応'] },
  { db: 'volcano', csv: ['火山現象', '火山現象対応'] },
  { db: 'barrier_free', csv: ['バリアフリー'] },
  { db: 'toilet_wheelchair', csv: ['車椅子対応トイレ'] },
  { db: 'elevator', csv: ['エレベーター有'] },
  { db: 'slope', csv: ['スロープ等'] },
  { db: 'braille_block', csv: ['点字ブロック'] },
  { db: 'first_floor_space', csv: ['避難スペースが1階'] },
  { db: 'facility_area', csv: ['施設面積（㎡）'] },
  { db: 'phone', csv: ['電話番号'] },
  { db: 'email', csv: ['メールアドレス'] },
  { db: 'website', csv: ['WebサイトURL'] },
  { db: 'stock', csv: ['備蓄情報'] },
  { db: 'note', csv: ['備考', '備考・その他'] },
];

export default function BulkShelterImport({ onImport }) {
  const [csvResult, setCsvResult] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [importing, setImporting] = useState(false); // 追加

  // CSVファイル選択時
  const handleFileChange = async (e) => {
    setError('');
    setMessage('');
    setMapping({});
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = parseShelterCsv(text);
      setCsvResult(parsed);

      // ヘッダー取得
      const headers = text.trim().split('\n')[0].split(',').map(h => h.trim());
      setCsvHeaders(headers);

      // 自動マッピング
      const initialMap = {};
      dbColumns.forEach(col => {
        const auto = autoMap.find(a => a.db === col.key);
        if (auto) {
          const found = auto.csv.find(c => headers.includes(c));
          initialMap[col.key] = found || '';
        } else {
          initialMap[col.key] = '';
        }
      });
      setMapping(initialMap);

      setMessage(`${parsed.length}件のデータを読み込みました。カラム対応を確認してください。`);
    } catch (err) {
      setError('CSVの読み込みまたは解析に失敗しました');
    }
  };

  // マッピング変更時
  const handleMappingChange = (dbCol, csvCol) => {
    setMapping({ ...mapping, [dbCol]: csvCol });
  };

  // インポート実行
  const handleImport = async () => {
    if (!csvResult.length) return;
    console.log("インポート中");
    setImporting(true);

    try {
      const dbRecords = csvResult.map(row => {
        const obj = {};
        dbColumns.forEach(col => {
          const csvCol = mapping[col.key];
          obj[col.key] = csvCol ? (row[csvCol] ?? null) : null;
        });

        if (mapping.prefecture === '都道府県名及び市町村名') {
          const val = obj.prefecture || '';
          const match = val.match(/^(.+?[都道府県])(.+)$/);
          if (match) {
            obj.prefecture = match[1];
            obj.city = match[2];
          } else {
            obj.city = '';
          }
        }

        const numericKeys = ['latitude', 'longitude', 'capacity', 'current_people', 'facility_area'];
        numericKeys.forEach(key => {
          if (obj[key] !== null) {
            obj[key] = obj[key] === '' ? null : Number(obj[key]);
          }
        });

        obj.current_people = 0;
        return obj;
      });

      // 重複チェック（例: name + address で重複判定）
      const seen = new Set();
      let hasDuplicate = false;
      dbRecords.forEach(rec => {
        const key = `${rec.name}_${rec.address}`;
        if (seen.has(key)) {
          hasDuplicate = true;
        }
        seen.add(key);
      });

      if (hasDuplicate) {
        setMessage('重複あり：既存データを上書きします');
      } else {
        setMessage('重複なし：新規データとして反映します');
      }

      // onImportを呼び出して親コンポーネントに処理を委譲
      if (onImport) {
        await onImport(dbRecords);
        setMessage(prev => prev + `\n${dbRecords.length}件のデータのインポート処理を要求しました。`);
      } else {
        // onImportが渡されない場合のフォールバック
        console.warn('onImport prop is not provided. Data is not saved.');
        setMessage(prev => prev + '\nプレビューのみ：onImportプロップがありません。');
      }

    } catch (err) {
      setError('インポート中にエラーが発生しました');
    } finally {
      setImporting(false);
      console.log("インポートを終了");
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-8 mt-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">避難所一括登録</h1>
      <div className="mb-4">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}
      {message && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{message}</div>
      )}

      {importing && (
        <div className="mb-4 flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
          </svg>
          <span className="text-blue-700 font-semibold">インポート処理中です。しばらくお待ちください…</span>
        </div>
      )}

      {Object.keys(mapping).length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">カラムマッピング</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 border-b text-left text-gray-600">DBカラム</th>
                  <th className="px-4 py-2 border-b text-left text-gray-600">CSVカラム</th>
                </tr>
              </thead>
              <tbody>
                {dbColumns.map(col => (
                  <tr key={col.key} className="hover:bg-blue-50">
                    <td className="px-4 py-2 border-b">{col.label}</td>
                    <td className="px-4 py-2 border-b">
                      <select
                        value={mapping[col.key]}
                        onChange={e => handleMappingChange(col.key, e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                        disabled={importing}
                      >
                        <option value="">選択してください</option>
                        {autoMap
                          .find(a => a.db === col.key)
                          ?.csv.map((csvCol, idx) => (
                            <option key={idx} value={csvCol}>
                              {csvCol}
                            </option>
                          ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <button
        onClick={handleImport}
        disabled={importing}
        className={`w-full py-3 rounded font-semibold text-white transition ${
          importing
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {importing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
            </svg>
            インポート中...
          </span>
        ) : (
          'インポート実行'
        )}
      </button>
    </div>
  );
}