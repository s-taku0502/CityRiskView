'use client';
import FilterPanel from '@/components/FilterPanel';
import { extractPrefectureAndCity } from '@/app/utils/address';
import { prefectures } from '@/app/utils/prefectures';
import { fetchCitiesByPref } from '@/app/utils/cityApi';
import { getPrefectureAddressPrefix } from '@/app/utils/prefectureMap';
import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import baseStockData from '@/data/ShelterStocks.json';

export default function StockViewPage() {
  const [keyword, setKeyword] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [prefecture, setPrefecture] = useState('');
  const [city, setCity] = useState('');
  const [shelters, setShelters] = useState([]);
  const [prefectureOptions] = useState(prefectures);
  const [cityOptions, setCityOptions] = useState([]);

  // const router = useRouter();

  // 都道府県変更時にSupabaseクエリで避難所を取得
  useEffect(() => {
    fetchSheltersByPrefecture();
  }, [prefecture]);

  useEffect(() => {
    if (prefecture) {
      fetchCities(prefecture);
    } else {
      setCityOptions([]);
    }
  }, [prefecture]);

  // SQLクエリ: SELECT * FROM shelters WHERE LEFT(address, 3) = '選択された都道府県の左3文字'
  const fetchSheltersByPrefecture = async () => {
    try {
      let query = supabase.from('shelters').select('*');
      
      if (prefecture) {
        // 選択された都道府県に対応する住所の左3文字を取得
        const addressPrefix = getPrefectureAddressPrefix(prefecture);
        if (addressPrefix) {
          // PostgreSQLのLEFT関数を使用して住所の左3文字で絞り込み
          // SQL: SELECT * FROM shelters WHERE LEFT(address, 3) = 'addressPrefix'
          query = query.filter('address', 'ilike', `${addressPrefix}%`);
        } else {
          setShelters([]);
          return;
        }
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      const sheltersWithKana = data.map(shelter => {
        const { prefecture: extractedPref, city } = extractPrefectureAndCity(shelter.address || "");
        return {
          ...shelter,
          name_kana: [shelter.name, shelter.name.replace(/市立|県立|小学校|中学校|高等学校|公民館/g, '')],
          prefecture: extractedPref,
          city,
        };
      });
      
      setShelters(sheltersWithKana);
      
      if (prefecture) {
        const addressPrefix = getPrefectureAddressPrefix(prefecture);
        console.log(`都道府県: ${prefecture}`);
      }
      
    } catch (error) {
      console.error('Error fetching shelters:', error);
      setShelters([]);
    }
  };

  // 市区町村一覧をAPIから取得
  const fetchCities = async (selectedPrefecture) => {
    const cities = await fetchCitiesByPref(selectedPrefecture);
    setCityOptions(cities);
  };

  // 追加の絞り込みロジック（キーワード、施設名、市区町村）
  const filteredShelters = shelters.filter((shelter) => {
    const matchesKeyword =
      !keyword ||
      shelter.name_kana.some((k) =>
        k.toLowerCase().includes(keyword.toLowerCase())
      );
    const matchesFacilityName =
      !facilityName ||
      shelter.name.toLowerCase().includes(facilityName.toLowerCase());
    
    const matchesCity = !city || shelter.city.startsWith(city);
    
    return matchesKeyword && matchesFacilityName && matchesCity;
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
      
      {/* 表示件数を表示 */}
      {/* <div className="text-sm text-gray-600">
        表示件数: {filteredShelters.length}件
        {prefecture && (
          <span className="ml-2 text-blue-600">
            ({prefecture} - 住所が「{getPrefectureAddressPrefix(prefecture)}」で始まる避難所)
          </span>
        )}
      </div> */}

      {filteredShelters.map((shelter) => {
        const stock = baseStockData[shelter.id] || [];
        return (
          <div key={shelter.id} className="border rounded p-4 shadow mt-6">
            <h3 className="text-xl font-semibold mb-2">{shelter.name}</h3>
            <p className="text-sm text-gray-600 mb-2">
              住所: {shelter.address} 
            </p>
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
