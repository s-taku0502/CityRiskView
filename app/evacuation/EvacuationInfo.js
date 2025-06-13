'use client';
import { useState } from 'react';
import { mockShelters } from './EvacuationMockData';
import FilterPanel from '../../components/FilterPanel'; // パスは調整してね

export default function EvacuationInfo() {
  // 検索フィルターの設定
  const [keyword, setKeyword] = useState('');
  const [prefecture, setPrefecture] = useState('');
  const [city, setCity] = useState('');

  // 検索条件
  const filteredShelters = mockShelters.filter((shelter) => {
    const keywordMatch = !keyword || shelter.name_kana.some((k) => k.includes(keyword));
    const prefectureMatch = !prefecture || shelter.prefecture === prefecture;
    const cityMatch = !city || shelter.city === city;
    return keywordMatch && prefectureMatch && cityMatch;
  });

  // 都道府県・市町村リストの抽出（重複除去）
  const prefectureOptions = [...new Set(mockShelters.map((s) => s.prefecture))];
  const cityOptions = [...new Set(mockShelters.map((s) => s.city))];

  return (
    <div className="p-4 space-y-4">
      {/* フィルターUIだけ分離 */}
      <FilterPanel
        keyword={keyword}
        setKeyword={setKeyword}
        prefecture={prefecture}
        setPrefecture={setPrefecture}
        city={city}
        setCity={setCity}
        prefectureOptions={prefectureOptions}
        cityOptions={cityOptions}
      />

      {/* 結果表示 */}
      <p className="pd-4 text-center font-bold">現在の避難情報はサンプルです。詳細は公式の避難情報をご確認ください。</p>
      {filteredShelters.map((shelter) => (
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
