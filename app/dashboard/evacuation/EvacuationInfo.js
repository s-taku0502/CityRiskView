'use client';
import {useState} from 'react'
import { mockShelters } from './EvacuationMockData';

export default function EvacuationInfo() {
  // データの定義づけ
  const [keyword, setKeyword] = useState('');
  const [prefecture, setPrefecture] = useState('');
  const [city,  setCity] = useState('');

  // フィルター処理
  const filteredShelters = mockShelters.filter((shelter) => {
    // キーワード検索
    const keywordMatch =
      !keyword || // 未入力時は全て通す
      shelter.name_kana.some((k) => k.includes(keyword));

    // 都道府県検索
    const prefectureMatch = !prefecture || shelter.prefecture === prefecture;

    // 市町村検索
    const cityMatch = !city || shelter.city === city;

    return keywordMatch && prefectureMatch && cityMatch;
  });

  // 都道府県・市町村リスト（選択肢）の抽出（自動取得）
  const prefectureOptions = [...new Set(mockShelters.map(s => s.prefecture))];
  const cityOptions = [...new Set(mockShelters.map(s => s.city))];

  return (
    <div className="p-4 space-y-4">
      {mockShelters.map((shelter) => (
        <div key={shelter.id} className="border p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold">{shelter.name}</h2>
          <p>状態: <strong>{shelter.status}</strong></p>
          <p>定員: {shelter.capacity}人 / 現在: {shelter.current_people}人</p>
          <p>
            在庫アラート:
            <span
              className={`ml-2 px-2 py-1 rounded-full text-sm 
              ${shelter.stock_alert 
                ? 'bg-red-100 text-red-700 font-semibold' 
                : 'bg-green-100 text-green-700'}`}
            >
              {shelter.stock_alert ? '要確認' : '正常'}
            </span>
          </p>
          <p>避難情報: {shelter.orders.length > 0 ? shelter.orders.join(', ') : 'なし'}</p>
          <p className="text-sm text-gray-500">最終更新: {shelter.last_updated}</p>
        </div>
      ))}
    </div>
  );
}
