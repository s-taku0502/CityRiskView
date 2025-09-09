'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import baseStockData from '@/data/ShelterStocks.json';
import FilterPanel from '@/components/FilterPanel';

export default function StockViewPage() {
  const [shelterId, setShelterId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [prefecture, setPrefecture] = useState('');
  const [city, setCity] = useState('');
  const [shelters, setShelters] = useState([]);

  const router = useRouter();

  useEffect(() => {
    fetchShelters();
  }, []);

  const fetchShelters = async () => {
    try {
      const { data, error } = await supabase
        .from('shelters')
        .select('*');
      
      if (error) throw error;
      
      // name_kana フィールドを追加（検索用）
      const sheltersWithKana = data.map(shelter => ({
        ...shelter,
        name_kana: [shelter.name, shelter.name.replace(/市立|県立|小学校|中学校|高等学校|公民館/g, '')]
      }));
      
      setShelters(sheltersWithKana);
    } catch (error) {
      console.error('Error fetching shelters:', error);
      setShelters([]);
    }
  };

  const handleAccess = () => {
    if (shelterId.trim()) {
      router.push(`/stock/manage?id=${shelterId}`);
    }
  };

  const prefectureOptions = [...new Set(shelters.map((s) => s.prefecture))];
  const cityOptions = [...new Set(
    shelters
      .filter((s) => !prefecture || s.prefecture === prefecture)
      .map((s) => s.city)
  )];

  const filteredShelters = shelters.filter((shelter) => {
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
    <div className="p-4 space-y-6">

      {/* フィルター UI */}
      {/* <div className="mb-8 border-t-2 border-gray-300" /> */}
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
          <div key={shelter.id} className="border rounded p-4 shadow mt-6">
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
