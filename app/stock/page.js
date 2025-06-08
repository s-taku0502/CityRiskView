'use client';

import { useState } from 'react';
import { mockShelters } from '@/app/evacuation/EvacuationMockData';
import baseStockData from '@/data/ShelterStocks.json';

export default function StockPage() {
  const [shelters, setShelters] = useState(
    mockShelters.map((shelter) => ({
      ...shelter,
      stock: (baseStockData[shelter.id] || []).map((item) => ({
        ...item,
        clicked: false, // 押した感覚用のフラグ
      })),
    }))
  );

  const handleUseStock = (shelterId, itemId) => {
    setShelters((prev) =>
      prev.map((shelter) => {
        if (shelter.id !== shelterId) return shelter;

        const updatedStock = shelter.stock.map((item) => {
          if (item.id === itemId) {
            return {
              ...item,
              counts: Math.max(0, item.counts - 1),
              clicked: true, // 押した瞬間
            };
          }
          return item;
        });

        // 300ms 後に clicked を false に戻す
        setTimeout(() => {
          setShelters((prev2) =>
            prev2.map((shelter2) => {
              if (shelter2.id !== shelterId) return shelter2;

              return {
                ...shelter2,
                stock: shelter2.stock.map((item) =>
                  item.id === itemId ? { ...item, clicked: false } : item
                ),
              };
            })
          );
        }, 300);

        return { ...shelter, stock: updatedStock };
      })
    );
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">避難所ごとの備蓄情報</h2>

      {shelters.map((shelter) => (
        <div key={shelter.id} className="mb-8 border rounded p-4 bg-white shadow">
          <h3 className="text-xl font-semibold mb-4">{shelter.name}</h3>

          {Object.entries(
            shelter.stock.reduce((acc, item) => {
              if (!acc[item.category]) acc[item.category] = [];
              acc[item.category].push(item);
              return acc;
            }, {})
          ).map(([category, items]) => (
            <div key={category} className="mb-4">
              <h4 className="text-md font-bold mb-2">{category}</h4>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between items-center border p-2 rounded"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">残数: {item.counts}</p>
                    </div>
                    <button
                      onClick={() => handleUseStock(shelter.id, item.id)}
                      className={`px-3 py-1 rounded text-white transition-transform duration-150
                        ${item.counts <= 0 ? 'bg-gray-600 cursor-not-allowed' : 'bg-red-500 hover:bg-red-800'}
                        ${item.clicked ? 'scale-95' : ''}`}
                      disabled={item.counts <= 0}
                    >
                      利用する
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
