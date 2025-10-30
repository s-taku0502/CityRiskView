'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { separatedPrefectures } from '../../utils/prefectures';

export default function DefaultPage() {
  const [prefCode, setPrefCode] = useState(separatedPrefectures[0].code);
  const [items, setItems] = useState([]); // ここでは避難所データを格納
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const tableName = useMemo(() => `shelters_pref${prefCode}`, [prefCode]);

  useEffect(() => {
    const fetchShelters = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/shelters?pref=${prefCode}`);
        if (!res.ok) throw new Error(`shelters API: ${res.status}`);
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : [];
        setItems(list);
      } catch (e) {
        setError(e?.message ?? String(e));
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchShelters();
  }, [prefCode]);

  const hazardLabels = {
    flood: '洪水',
    landslide: '崖崩れ/地滑り',
    high_tide: '高潮',
    earthquake: '地震',
    tsunami: '津波',
    large_fire: '大規模火事',
    inland_flood: '内水氾濫',
    volcano: '火山現象',
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <label htmlFor="pref-select" className="font-medium">都道府県：</label>
        <select
          id="pref-select"
          value={prefCode}
          onChange={(e) => setPrefCode(e.target.value)}
          className="border rounded px-2 py-1"
        >
          {separatedPrefectures.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </select>

        <div className="ml-auto text-sm text-gray-600">表示テーブル: {tableName}</div>
      </div>

      {loading && <div>読み込み中...</div>}
      {error && <div className="text-red-600">エラー: {error}</div>}

      {!loading && items.length === 0 && <div>避難所データがありません。</div>}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-4">
        {items.map((s) => (
          <article key={s.id ?? `${s.pref_name}-${s.common_id}`} className="border rounded-lg p-4 shadow-sm bg-white">
            <header className="mb-2">
              <div className="text-lg font-semibold">{s.name || '無名の施設'}</div>
              <div className="text-sm text-gray-500">{s.pref_name || ''} {s.address || ''}</div>
            </header>

            <div className="mb-2 text-sm">
              <div><span className="font-medium">共通ID:</span> {s.common_id || '—'}</div>
              <div><span className="font-medium">緯度/経度:</span> {s.latitude ?? '—'} / {s.longitude ?? '—'}</div>
            </div>

            <div className="mb-3">
              <div className="font-medium text-sm mb-1">対応想定災害</div>
              <div className="flex flex-wrap gap-2">
                {Object.keys(hazardLabels).map((key) => {
                  if (s[key]) {
                    return (
                      <span key={key} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                        {hazardLabels[key]}
                      </span>
                    );
                  }
                  return null;
                })}
                {Object.keys(hazardLabels).every((k) => !s[k]) && (
                  <span className="text-xs text-gray-500">特に指定なし</span>
                )}
              </div>
            </div>

            {s.remarks && (
              <div className="mb-3 text-sm text-gray-700">
                <div className="font-medium text-sm mb-1">備考</div>
                <div>{s.remarks}</div>
              </div>
            )}

            <footer className="text-xs text-gray-500">
              <div>データID: {s.id ?? '—'}</div>
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}