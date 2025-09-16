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
    setImporting(true); // インポート中フラグON
    try {
      const dbRecords = csvResult.map(row => {
        const obj = {};
        dbColumns.forEach(col => {
          const csvCol = mapping[col.key];
          if (
            (col.key === 'prefecture' || col.key === 'city') &&
            mapping['prefecture'] === '都道府県名及び市町村名'
          ) {
            const val = row['都道府県名及び市町村名'] || '';
            const match = val.match(/^(.+?[都道府県])(.+)$/);
            if (match) {
              obj['prefecture'] = match[1];
              obj['city'] = match[2];
            } else {
              obj['prefecture'] = val;
              obj['city'] = '';
            }
          } else if (csvCol) {
            obj[col.key] = row[csvCol] ?? null;
          } else {
            obj[col.key] = null;
          }
          if (['latitude', 'longitude', 'capacity', 'current_people', 'facility_area'].includes(col.key) && obj[col.key] !== null) {
            obj[col.key] = obj[col.key] === '' ? null : Number(obj[col.key]);
          }
        });
        return obj;
      });
      if (onImport) await onImport(dbRecords);
      setMessage('インポートが完了しました。');
    } catch (e) {
      setError('インポート中にエラーが発生しました');
    } finally {
      setImporting(false); // インポート中フラグOFF
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h3 className="text-lg font-semibold mb-4">CSVファイルから一括インポート</h3>
      <input type="file" accept=".csv" onChange={handleFileChange} aria-label="CSVファイル選択" />
      {error && <div className="text-red-600 mt-2" role="alert">{error}</div>}
      {message && <div className="text-green-600 mt-2">{message}</div>}

      {/* カラムマッピングUI */}
      {csvHeaders.length > 0 && (
        <div className="my-4">
          <h4 className="font-semibold mb-2">カラム対応表</h4>
          <table className="mb-4 border" aria-label="カラム対応表">
            <thead>
              <tr>
                <th className="px-2 py-1 border">Supabaseカラム</th>
                <th className="px-2 py-1 border">CSVカラム</th>
              </tr>
            </thead>
            <tbody>
              {dbColumns.map(col => (
                <tr key={col.key}>
                  <td className="px-2 py-1 border">{col.label} <span className="text-xs text-gray-400">({col.key})</span></td>
                  <td className="px-2 py-1 border">
                    <select
                      value={mapping[col.key] || ''}
                      onChange={e => handleMappingChange(col.key, e.target.value)}
                      className="border rounded px-1 py-0.5"
                      aria-label={`${col.label}のCSVカラム選択`}
                    >
                      <option value="">（未対応）</option>
                      {csvHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            className={`px-4 py-2 rounded text-white ${importing ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            onClick={handleImport}
            disabled={Object.values(mapping).every(v => !v) || importing}
            aria-disabled={Object.values(mapping).every(v => !v) || importing}
          >
            {importing ? 'インポート中...' : 'インポート実行'}
          </button>
        </div>
      )}

      {csvResult.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">プレビュー（先頭5件）</h4>
          <pre className="bg-gray-100 p-2 rounded text-xs max-h-48 overflow-auto" aria-label="CSVプレビュー">
            {JSON.stringify(csvResult.slice(0, 5), null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}