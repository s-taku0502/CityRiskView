'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { prefMapping } from '@/app/utils/prefectures'

export default function StockListPage() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prefName, setPrefName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // サブドメイン → 都道府県マッピング
  useEffect(() => {
    const subdomain = window.location.hostname.split('.')[0];

    const matchedPref = prefMapping[subdomain] || '';
    setPrefName(matchedPref);
  }, []);

  // localhost の場合だけ、位置情報から都道府県を判別
  useEffect(() => {
    const isLocal = window.location.hostname === 'localhost';
    if (!isLocal || prefName) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ja`
          );
          const data = await res.json();
          const detectedPref = data?.address?.state || '石川県';
          if (detectedPref) {
            setPrefName(detectedPref);
          } else {
            setErrorMsg('位置情報から都道府県を特定できませんでした。');
          }
        } catch (error) {
          console.error('位置情報の取得に失敗:', error);
          setErrorMsg('位置情報の取得に失敗しました。');
        }
      },
      (err) => {
        console.error('位置情報エラー:', err);
        setErrorMsg('位置情報の取得が許可されませんでした。');
      }
    );
  }, [prefName]);

  // 備蓄情報を取得
  useEffect(() => {
    if (!prefName) return;
    const fetchStocks = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('stock_items')
        .select(`
          id, item_name, category, quantity, unit, expiration_date, remarks,
          shelters_pref47(name, address)
        `)
        .eq('pref_name', prefName);

      if (error) console.error('Error:', error);
      setStocks(data || []);
      setLoading(false);
    };
    fetchStocks();
  }, [prefName]);

  // 表示条件分岐
  if (errorMsg) {
    return (
      <div className="p-6 text-red-600">
        {errorMsg}
        <br />
        位置情報を有効にして再読み込みしてください。
      </div>
    );
  }

  if (!prefName) {
    return (
      <div className="p-6 text-red-600">
        サブドメインから都道府県を特定できませんでした。
        <br />
        例: <code>cityriskview-tokyo.vercel.app</code> のような形式でアクセスしてください。
      </div>
    );
  }

  if (loading) return <p className="p-6">読み込み中...</p>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">{prefName}の備蓄情報一覧</h2>
      {stocks.length === 0 ? (
        <p>登録された備蓄情報はありません。</p>
      ) : (
        <div className="space-y-4">
          {stocks.map((stock) => (
            <div key={stock.id} className="border rounded p-4 shadow">
              <h3 className="font-semibold">{stock.item_name}</h3>
              <p>分類: {stock.category || '-'}</p>
              <p>
                数量: {stock.quantity} {stock.unit}
              </p>
              <p>施設: {stock.shelters_pref47?.name || '不明'}</p>
              <p>住所: {stock.shelters_pref47?.address || '-'}</p>
              <p>備考: {stock.remarks || '-'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
