'use client';
import FilterPanel from '@/components/FilterPanel';
import { extractPrefectureAndCity } from '@/app/utils/address';
import { prefectures } from '@/app/utils/prefectures';
import { fetchCitiesByPref } from '@/app/utils/cityApi';
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

  // 都道府県名から住所の左3文字へのマッピング
  const getPrefectureAddressPrefix = (prefectureName) => {
    const prefectureMap = {
      '北海道': '北海道',
      '青森県': '青森県',
      '岩手県': '岩手県',
      '宮城県': '宮城県',
      '秋田県': '秋田県',
      '山形県': '山形県',
      '福島県': '福島県',
      '茨城県': '茨城県',
      '栃木県': '栃木県',
      '群馬県': '群馬県',
      '埼玉県': '埼玉県',
      '千葉県': '千葉県',
      '東京都': '東京都',
      '神奈川県': '神奈川',
      '新潟県': '新潟県',
      '富山県': '富山県',
      '石川県': '石川県',
      '福井県': '福井県',
      '山梨県': '山梨県',
      '長野県': '長野県',
      '岐阜県': '岐阜県',
      '静岡県': '静岡県',
      '愛知県': '愛知県',
      '三重県': '三重県',
      '滋賀県': '滋賀県',
      '京都府': '京都府',
      '大阪府': '大阪府',
      '兵庫県': '兵庫県',
      '奈良県': '奈良県',
      '和歌山県': '和歌山',
      '鳥取県': '鳥取県',
      '島根県': '島根県',
      '岡山県': '岡山県',
      '広島県': '広島県',
      '山口県': '山口県',
      '徳島県': '徳島県',
      '香川県': '香川県',
      '愛媛県': '愛媛県',
      '高知県': '高知県',
      '福岡県': '福岡県',
      '佐賀県': '佐賀県',
      '長崎県': '長崎県',
      '熊本県': '熊本県',
      '大分県': '大分県',
      '宮崎県': '宮崎県',
      '鹿児島県': '鹿児島',
      '沖縄県': '沖縄県'
    };
    return prefectureMap[prefectureName] || '';
  };

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
      
      // デバッグ用ログ
      if (prefecture) {
        const addressPrefix = getPrefectureAddressPrefix(prefecture);
        console.log(`SQL実行: SELECT * FROM shelters WHERE LEFT(address, 3) = '${addressPrefix}'`);
        console.log(`都道府県: ${prefecture}, 住所プレフィックス: ${addressPrefix}, 該当件数: ${sheltersWithKana.length}`);
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
      <div className="text-sm text-gray-600">
        表示件数: {filteredShelters.length}件
        {prefecture && (
          <span className="ml-2 text-blue-600">
            ({prefecture} - 住所が「{getPrefectureAddressPrefix(prefecture)}」で始まる避難所)
          </span>
        )}
      </div>

      {filteredShelters.map((shelter) => {
        const stock = baseStockData[shelter.id] || [];
        return (
          <div key={shelter.id} className="border rounded p-4 shadow mt-6">
            <h3 className="text-xl font-semibold mb-2">{shelter.name}</h3>
            <p className="text-sm text-gray-600 mb-2">
              住所: {shelter.address} 
              <span className="text-xs text-blue-500 ml-2">
                (左3文字: {shelter.address?.substring(0, 3)})
              </span>
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
