'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockShelters } from '@/app/evacuation/EvacuationMockData';
import baseStockData from '@/data/ShelterStocks.json';
import FilterPanel from '@/components/FilterPanel';

export default function StockViewPage() {
  const [shelterId, setShelterId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [prefecture, setPrefecture] = useState('');
  const [city, setCity] = useState('');

  const router = useRouter();

  const handleAccess = () => {
    if (shelterId.trim()) {
      router.push(`/stock/manage?id=${shelterId}`);
    }
  };

  const prefectureOptions = [...new Set(mockShelters.map((s) => s.prefecture))];
  const cityOptions = [...new Set(
    mockShelters
      .filter((s) => !prefecture || s.prefecture === prefecture)
      .map((s) => s.city)
  )];

  const filteredShelters = mockShelters.filter((shelter) => {
    const matchesKeyword =
      !keyword ||
      shelter.name_kana.some((k) =>
        k.toLowerCase().includes(keyword.toLowerCase())
      );
    const matchesPrefecture = !prefecture || shelter.prefecture === prefecture;
    const matchesCity = !city || shelter.city === city;
    return matchesKeyword && matchesPrefecture && matchesCity;
  });

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-center">避難所の備蓄情報（閲覧専用）</h2>
      <p className="text-center text-sm text-gray-600">
        ※ このページは閲覧専用です。備蓄の利用・補充はできません。
      </p>

      {/* 管理者・利用者向けアクセスフォーム */}
      <div className="mt-8 p-4 border-t pt-6 text-center">
        <h4 className="font-semibold text-lg">管理者・利用者の方はこちら</h4>
        <p className="text-sm text-gray-500 mb-2">避難所IDを入力して、操作ページへ移動</p>
        <input
          type="text"
          value={shelterId}
          onChange={(e) => setShelterId(e.target.value)}
          placeholder="避難所IDを入力"
          className="border px-3 py-2 rounded w-64"
        />
        <button
          onClick={handleAccess}
          className="ml-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          移動する
        </button>
      </div>

      {/* フィルター UI */}
      <div className="mt-6">
        <h4 className="font-semibold text-lg mb-2">避難所の絞り込み</h4>
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
      </div>

      {/* 絞り込んだ避難所の表示 */}
      {filteredShelters.map((shelter) => {
        const stock = baseStockData[shelter.id] || [];

        return (
          <div key={shelter.id} className="border rounded p-4 shadow bg-white mt-6">
            <h3 className="text-xl font-semibold mb-2">{shelter.name}</h3>

            {Object.entries(
              stock.reduce((acc, item) => {
                if (!acc[item.category]) acc[item.category] = [];
                acc[item.category].push(item);
                return acc;
              }, {})
            ).map(([category, items]) => (
              <div key={category} className="mb-4">
                <h4 className="text-md font-bold mb-2">{category}</h4>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item.id} className="flex justify-between border p-2 rounded">
                      <span>{item.name}</span>
                      <span className="text-gray-600">残数: {item.counts}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
