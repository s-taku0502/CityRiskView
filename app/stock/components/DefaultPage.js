'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { separatedPrefectures } from '../../utils/prefectures';

export default function WeatherAlertList() {
  const [prefCode, setPrefCode] = useState(separatedPrefectures[0].code);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const tableName = useMemo(() => `shelters_pref${prefCode}`, [prefCode]);

  useEffect(() => {
    const fetchShelters = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/shelters?code=${prefCode}`);
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const json = await res.json();
        setRows(json.data || []);
      } catch (e) {
        setError(e.message);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    fetchShelters();
  }, [prefCode]);

  return (
    <div>
      <label htmlFor="pref-select">都道府県を選択：</label>
      <select
        id="pref-select"
        value={prefCode}
        onChange={(e) => setPrefCode(e.target.value)}
      >
        {separatedPrefectures.map((p) => (
          <option key={p.code} value={p.code}>
            {p.name}
          </option>
        ))}
      </select>

      <div style={{ marginTop: 12 }}>
        <strong>表示テーブル:</strong> {tableName}
      </div>

      {loading && <div>読み込み中...</div>}
      {error && <div style={{ color: 'red' }}>エラー: {error}</div>}

      <div style={{ marginTop: 12 }}>
        {rows.length === 0 && !loading && <div>データがありません</div>}
        {rows.length > 0 && (
          <ul>
            {rows.map((r, i) => (
              <li key={i}>
                {/* レコードの構造が不明なため JSON 表示。必要ならフィールドを指定してください。 */}
                <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(r, null, 2)}</pre>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}