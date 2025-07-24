'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import baseStockData from '@/data/ShelterStocks.json';

export default function CountEditPage() {
  const [shelters, setShelters] = useState([]);
  const [selectedShelter, setSelectedShelter] = useState(null);
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const shelterId = searchParams.get('id');

  useEffect(() => {
    fetchShelters();
  }, []);

  useEffect(() => {
    if (shelterId && shelters.length > 0) {
      const shelter = shelters.find(s => s.id === shelterId);
      if (shelter) {
        setSelectedShelter(shelter);
        loadStockData(shelterId);
      }
    }
  }, [shelterId, shelters]);

  const fetchShelters = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shelters')
        .select('*');
      
      if (error) throw error;
      
      setShelters(data || []);
    } catch (error) {
      console.error('Error fetching shelters:', error);
      setShelters([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStockData = (shelterId) => {
    const stock = baseStockData[shelterId] || [];
    setStockData(stock);
  };

  const handleShelterSelect = (shelter) => {
    setSelectedShelter(shelter);
    loadStockData(shelter.id);
    router.push(`/stock/manage?id=${shelter.id}`);
  };

  const updateStockCount = (itemId, newCount) => {
    setStockData(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, counts: Math.max(0, newCount) } : item
      )
    );
  };

  const handleSave = () => {
    // 実際のアプリケーションでは、ここでSupabaseに保存
    alert('備蓄数の更新が完了しました');
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold text-center">備蓄管理システム</h2>
      
      {!selectedShelter ? (
        <div>
          <h3 className="text-lg font-semibold mb-4">避難所を選択してください</h3>
          <div className="grid gap-3">
            {shelters.map((shelter) => (
              <button
                key={shelter.id}
                onClick={() => handleShelterSelect(shelter)}
                className="p-3 border rounded hover:bg-gray-50 text-left"
              >
                <div className="font-medium">{shelter.name}</div>
                <div className="text-sm text-gray-600">{shelter.address}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{selectedShelter.name}</h3>
            <button
              onClick={() => setSelectedShelter(null)}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              戻る
            </button>
          </div>

          {Object.entries(
            stockData.reduce((acc, item) => {
              if (!acc[item.category]) acc[item.category] = [];
              acc[item.category].push(item);
              return acc;
            }, {})
          ).map(([category, items]) => (
            <div key={category} className="mb-6">
              <h4 className="text-md font-bold mb-3 bg-gray-100 p-2 rounded">{category}</h4>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border p-3 rounded">
                    <span className="font-medium">{item.name}</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateStockCount(item.id, item.counts - 1)}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        disabled={item.counts <= 0}
                      >
                        −
                      </button>
                      <span className="w-16 text-center font-bold text-lg">
                        {item.counts}
                      </span>
                      <button
                        onClick={() => updateStockCount(item.id, item.counts + 1)}
                        className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        ＋
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="text-center mt-6">
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              変更を保存
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
