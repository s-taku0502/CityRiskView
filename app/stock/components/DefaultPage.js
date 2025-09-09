'use client';
import FilterPanel from '@/components/FilterPanel';
import { extractPrefectureAndCity } from '@/app/utils/address';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import baseStockData from '@/data/ShelterStocks.json';

export default function StockViewPage() {
  const [keyword, setKeyword] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [prefecture, setPrefecture] = useState('');
  const [city, setCity] = useState('');
  const [shelters, setShelters] = useState([]);
  const [prefectureOptions, setPrefectureOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);

  const router = useRouter();

  useEffect(() => {
    fetchShelters();
    fetchPrefectures();
  }, []);

  useEffect(() => {
    if (prefecture) {
      fetchCities(prefecture);
    } else {
      setCityOptions([]);
    }
  }, [prefecture]);

  const fetchShelters = async () => {
    try {
      const { data, error } = await supabase
        .from('shelters')
        .select('*');
      if (error) throw error;
      const sheltersWithKana = data.map(shelter => {
        const { prefecture, city } = extractPrefectureAndCity(shelter.address || "");
        return {
          ...shelter,
          name_kana: [shelter.name, shelter.name.replace(/市立|県立|小学校|中学校|高等学校|公民館/g, '')],
          prefecture,
          city,
        };
      });
      setShelters(sheltersWithKana);
    } catch (error) {
      console.error('Error fetching shelters:', error);
      setShelters([]);
    }
  };

  // 都道府県一覧をDBから取得
  const fetchPrefectures = async () => {
    try {
      const { data, error } = await supabase
        .from('shelters')
        .select('prefecture')
        .distinct();
      if (error) throw error;
      setPrefectureOptions(data.map(d => d.prefecture));
    } catch (error) {
      console.error('Error fetching prefectures:', error);
      setPrefectureOptions([]);
    }
  };

  // 市区町村一覧をDBから取得（都道府県で絞る）
  const fetchCities = async (selectedPrefecture) => {
    try {
      const { data, error } = await supabase
        .from('shelters')
        .select('city')
        .eq('prefecture', selectedPrefecture)
        .distinct();
      if (error) throw error;
      setCityOptions(data.map(d => d.city));
    } catch (error) {
      console.error('Error fetching cities:', error);
      setCityOptions([]);
    }
  };

  // 絞り込みロジック
  const filteredShelters = shelters.filter((shelter) => {
    const matchesKeyword =
      !keyword ||
      shelter.name_kana.some((k) =>
        k.toLowerCase().includes(keyword.toLowerCase())
      );
    const matchesFacilityName =
      !facilityName ||
      shelter.name.toLowerCase().includes(facilityName.toLowerCase());
    const matchesPrefecture = !prefecture || shelter.prefecture === prefecture;
    const matchesCity = !city || shelter.city === city;
    return matchesKeyword && matchesFacilityName && matchesPrefecture && matchesCity;
  });

  return (
    <div className="p-4 space-y-6">
      <div className="mt-6">
        <h4 className="font-semibold text-lg mb-2">避難所の絞り込み</h4>
        <FilterPanel
          keyword={keyword}
          setKeyword={setKeyword}
          facilityName={facilityName}
          setFacilityName={setFacilityName}
          prefecture={prefecture}
          setPrefecture={setPrefecture}
          city={city}
          setCity={setCity}
          prefectureOptions={prefectureOptions}
          cityOptions={cityOptions}
        />
      </div>
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
