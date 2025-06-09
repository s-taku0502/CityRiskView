'use client';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { mockShelters } from '@/app/evacuation/EvacuationMockData';
import baseStockData from '@/data/ShelterStocks.json';

export default function StockManagePage() {
  const searchParams = useSearchParams();
  const shelterId = searchParams.get('id');
  const [selectedShelter, setSelectedShelter] = useState(null);
  const [stockData, setStockData] = useState([]);

  // 初期ロード
  useEffect(() => {
    if (shelterId) {
      const shelter = mockShelters.find((s) => s.id === shelterId);
      if (shelter) {
        setSelectedShelter(shelter);
        setStockData(baseStockData[shelterId] || []);
      }
    }
  }, [shelterId]);

  const handleUse = (itemId) => {
    setStockData((prev) =>
      prev.map((item) =>
        item.id === itemId && item.counts > 0
          ? { ...item, counts: item.counts - 1 }
          : item
      )
    );
  };

  const handleAdd = (itemId) => {
    setStockData((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, counts: item.counts + 1 } : item
      )
    );
  };

  if (!shelterId || !selectedShelter) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 font-bold">避難所IDが無効です。</p>
        <a href="/stock" className="text-blue-600 underline mt-4 inline-block">
          戻る
        </a>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">{selectedShelter.name}（管理ページ）</h2>
      <p className="text-sm text-gray-500">備蓄の利用・補充が可能です。</p>

      {Object.entries(
        stockData.reduce((acc, item) => {
          if (!acc[item.category]) acc[item.category] = [];
          acc[item.category].push(item);
          return acc;
        }, {})
      ).map(([category, items]) => (
        <div key={category} className="mb-4">
          <h3 className="text-lg font-semibold">{category}</h3>
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between border p-3 rounded shadow-sm"
              >
                <div className="font-medium">{item.name}</div>
                <div className="flex justify-end items-center space-x-4 mt-2 sm:mt-0">
                  <span
                    className={`text-sm px-2 py-1 rounded-full font-semibold ${item.counts <= 10
                        ? 'bg-red-100 text-red-600'
                        : item.counts <= 30
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                  >
                    残数: {item.counts}
                  </span>
                  <button
                    onClick={() => handleUse(item.id)}
                    className="px-3 py-1 bg-red-500 rounded hover:bg-red-600"
                  >
                    利用
                  </button>
                  <button
                    onClick={() => handleAdd(item.id)}
                    className="px-3 py-1 bg-green-500 rounded hover:bg-green-600"
                  >
                    補充
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
