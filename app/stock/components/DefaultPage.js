'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function StockSearchPage() {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 検索関数
  const handleSearch = async () => {
    if (!keyword.trim()) {
      setErrorMsg('検索ワードを入力してください。');
      setResults([]);
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // Supabase で部分一致検索
      const { data, error } = await supabase
        .from('stock_items')
        .select(`
          id,
          item_name,
          category,
          quantity,
          unit,
          expiration_date,
          remarks,
          pref_name,
          shelters_pref47 ( name, address )
        `)
        .ilike('item_name', `%${keyword}%`); // 部分一致検索

      if (error) throw error;

      setResults(data || []);
    } catch (error) {
      console.error('検索エラー:', error);
      setErrorMsg('データの取得中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  // Enterキーで検索可能に
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">備蓄品キーワード検索</h2>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="例: 水, 毛布, 食料..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          className="border p-2 rounded w-full"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          検索
        </button>
      </div>

      {errorMsg && <p className="text-red-600 mb-4">{errorMsg}</p>}
      {loading && <p>検索中...</p>}

      {!loading && results.length > 0 && (
        <div className="space-y-4">
          {results.map((item) => (
            <div key={item.id} className="border rounded p-4 shadow-sm">
              <h3 className="font-semibold text-lg">{item.item_name}</h3>
              <p className="text-sm text-gray-600">
                区分: {item.category || '-'} / 数量: {item.quantity} {item.unit}
              </p>
              <p className="text-sm text-gray-600">
                有効期限: {item.expiration_date || '未設定'}
              </p>
              <p className="text-sm text-gray-600">
                備考: {item.remarks || '-'}
              </p>
              {item.shelters_pref47 && (
                <p className="text-sm text-gray-600 mt-1">
                  施設: {item.shelters_pref47.name}（{item.shelters_pref47.address}）
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && !errorMsg && keyword && results.length === 0 && (
        <p className="text-gray-600">該当する備蓄品は見つかりませんでした。</p>
      )}
    </div>
  );
}
