"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import Papa from 'papaparse';

export default function ShelterManagement() {
  const [shelters, setShelters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    // 必須項目
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    capacity: "",
    
    // 入力推奨項目
    disaster_flood: false,
    disaster_earthquake: false,
    disaster_tsunami: false,
    disaster_landslide: false,
    disaster_storm_surge: false,
    disaster_fire: false,
    disaster_inland_flood: false,
    disaster_volcano: false,
    current_people: "",
    phone: "",
    
    // 補助表示項目
    wheelchair_accessible: false,
    elevator_available: false,
    slope_available: false,
    braille_block: false,
    first_floor_access: false,
    area: "",
    stock: "",
    email: "",
    url: "",
    notes: ""
  });

  // CSV関連の状態
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [showCsvPreview, setShowCsvPreview] = useState(false);
  const [csvImportLoading, setCsvImportLoading] = useState(false);
  const [selectedRegionFormat, setSelectedRegionFormat] = useState('');

  // 拡張されたデータベースカラム定義
  const dbColumns = {
    required: [
      { key: 'name', label: '避難所名', type: 'text', placeholder: '例: ○○小学校体育館' },
      { key: 'address', label: '住所', type: 'text', placeholder: '例: 東京都○○区○○1-2-3' },
      { key: 'latitude', label: '緯度', type: 'number', placeholder: '例: 35.6762' },
      { key: 'longitude', label: '経度', type: 'number', placeholder: '例: 139.6503' },
      { key: 'capacity', label: '収容人数', type: 'number', placeholder: '例: 500' }
    ],
    recommended: [
      { key: 'disaster_flood', label: '洪水対応', type: 'checkbox' },
      { key: 'disaster_earthquake', label: '地震対応', type: 'checkbox' },
      { key: 'disaster_tsunami', label: '津波対応', type: 'checkbox' },
      { key: 'disaster_landslide', label: '土砂災害対応', type: 'checkbox' },
      { key: 'disaster_storm_surge', label: '高潮対応', type: 'checkbox' },
      { key: 'disaster_fire', label: '大規模火災対応', type: 'checkbox' },
      { key: 'disaster_inland_flood', label: '内水氾濫対応', type: 'checkbox' },
      { key: 'disaster_volcano', label: '火山現象対応', type: 'checkbox' },
      { key: 'current_people', label: '現在の避難者数', type: 'number', placeholder: '例: 0' },
      { key: 'phone', label: '電話番号', type: 'tel', placeholder: '例: 03-1234-5678' }
    ],
    auxiliary: [
      { key: 'wheelchair_accessible', label: '車椅子対応トイレ', type: 'checkbox' },
      { key: 'elevator_available', label: 'エレベーター有', type: 'checkbox' },
      { key: 'slope_available', label: 'スロープ等', type: 'checkbox' },
      { key: 'braille_block', label: '点字ブロック', type: 'checkbox' },
      { key: 'first_floor_access', label: '避難スペースが1階', type: 'checkbox' },
      { key: 'area', label: '施設面積（㎡）', type: 'number', placeholder: '例: 1000' },
      { key: 'email', label: 'メールアドレス', type: 'email', placeholder: '例: shelter@example.com' },
      { key: 'url', label: 'WebサイトURL', type: 'url', placeholder: '例: https://example.com' },
      { key: 'stock', label: '備蓄情報', type: 'textarea', placeholder: 'JSON形式: {"水": 1000, "毛布": 200}\nまたは\nテキスト形式:\n水: 1000L\n毛布: 200枚' },
      { key: 'notes', label: '備考・その他', type: 'textarea', placeholder: '例: ペット可、Wi-Fi完備など' }
    ]
  };

  // 地域ごとのプリセットマッピング（拡張版）
  const regionPresets = {
    tokyo: {
      name: '東京都形式',
      mapping: {
        name: ['施設名'],
        address: ['所在地住所'],
        latitude: ['緯度'],
        longitude: ['経度'],
        disaster_flood: ['洪水'],
        disaster_landslide: ['崖崩れ、土石流及び地滑り'],
        disaster_storm_surge: ['高潮'],
        disaster_earthquake: ['地震'],
        disaster_tsunami: ['津波'],
        disaster_fire: ['大規模な火事'],
        disaster_inland_flood: ['内水氾濫'],
        disaster_volcano: ['火山現象'],
        wheelchair_accessible: ['車椅子使用者対応トイレ'],
        elevator_available: ['エレベーター有'],
        slope_available: ['スロープ等'],
        braille_block: ['点字ブロック'],
        first_floor_access: ['避難スペースが１階']
      }
    },
    toyama: {
      name: '富山市形式',
      mapping: {
        name: ['名 称'],
        address: ['所 在 地'],
        phone: ['電話番号'],
        area: ['面積'],
        capacity: ['収容人員'],
        disaster_flood: ['洪水'],
        disaster_landslide: ['土砂'],
        notes: ['備考']
      }
    },
    kanazawa: {
      name: '金沢市形式',
      mapping: {
        name: ['名称'],
        address: ['所在地_連結表記'],
        latitude: ['緯度'],
        longitude: ['経度'],
        capacity: ['想定収容人数'],
        phone: ['電話番号'],
        email: ['連絡先メールアドレス'],
        url: ['URL'],
        disaster_flood: ['災害種別_洪水'],
        disaster_landslide: ['災害種別_崖崩れ、土石流及び地滑り'],
        disaster_storm_surge: ['災害種別_高潮'],
        disaster_earthquake: ['災害種別_地震'],
        disaster_tsunami: ['災害種別_津波'],
        disaster_fire: ['災害種別_大規模な火事'],
        disaster_inland_flood: ['災害種別_内水氾濫'],
        disaster_volcano: ['災害種別_火山現象'],
        notes: ['備考']
      }
    },
    custom: {
      name: 'カスタム',
      mapping: {}
    }
  };

  // 避難所一覧を取得
  const fetchShelters = async () => {
    try {
      const { data, error } = await supabase
        .from('shelters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShelters(data || []);
    } catch (error) {
      console.error('避難所データの取得に失敗:', error);
      setMessage("避難所データの取得に失敗しました");
    }
  };

  useEffect(() => {
    fetchShelters();
  }, []);

  // フォーム入力の処理
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // 災害対応情報を文字列として結合
  const getDisasterTypes = (data) => {
    const disasters = [];
    if (data.disaster_flood) disasters.push('洪水');
    if (data.disaster_earthquake) disasters.push('地震');
    if (data.disaster_tsunami) disasters.push('津波');
    if (data.disaster_landslide) disasters.push('土砂災害');
    if (data.disaster_storm_surge) disasters.push('高潮');
    if (data.disaster_fire) disasters.push('火災');
    if (data.disaster_inland_flood) disasters.push('内水氾濫');
    if (data.disaster_volcano) disasters.push('火山');
    return disasters.join(', ');
  };

  // バリアフリー情報を文字列として結合
  const getAccessibilityFeatures = (data) => {
    const features = [];
    if (data.wheelchair_accessible) features.push('車椅子対応');
    if (data.elevator_available) features.push('エレベーター');
    if (data.slope_available) features.push('スロープ');
    if (data.braille_block) features.push('点字ブロック');
    if (data.first_floor_access) features.push('1階アクセス');
    return features.join(', ');
  };

  // フォーム送信処理
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      // 必須項目のバリデーション
      const requiredFields = dbColumns.required;
      for (const field of requiredFields) {
        if (!formData[field.key] || formData[field.key].toString().trim() === '') {
          setMessage(`${field.label}は必須項目です`);
          setIsLoading(false);
          return;
        }
      }

      // stockデータの処理
      let stockData = null;
      if (formData.stock && formData.stock.trim()) {
        try {
          stockData = JSON.parse(formData.stock);
        } catch {
          stockData = formData.stock;
        }
      }

      // 災害対応とバリアフリー情報をJSONとして保存
      const shelterData = {
        name: formData.name,
        address: formData.address,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        capacity: parseInt(formData.capacity) || null,
        current_people: parseInt(formData.current_people) || 0,
        stock: stockData
      };

      // 拡張情報をJSONとして追加保存する場合
      const extendedInfo = {
        disaster_types: getDisasterTypes(formData),
        accessibility: getAccessibilityFeatures(formData),
        phone: formData.phone,
        email: formData.email,
        url: formData.url,
        area: formData.area ? parseInt(formData.area) : null,
        notes: formData.notes,
        disaster_details: {
          flood: formData.disaster_flood,
          earthquake: formData.disaster_earthquake,
          tsunami: formData.disaster_tsunami,
          landslide: formData.disaster_landslide,
          storm_surge: formData.disaster_storm_surge,
          fire: formData.disaster_fire,
          inland_flood: formData.disaster_inland_flood,
          volcano: formData.disaster_volcano
        },
        accessibility_details: {
          wheelchair_accessible: formData.wheelchair_accessible,
          elevator_available: formData.elevator_available,
          slope_available: formData.slope_available,
          braille_block: formData.braille_block,
          first_floor_access: formData.first_floor_access
        }
      };

      // stockフィールドに拡張情報も含めて保存
      if (stockData && typeof stockData === 'object') {
        shelterData.stock = { ...stockData, ...extendedInfo };
      } else {
        shelterData.stock = extendedInfo;
      }

      const { error } = await supabase
        .from('shelters')
        .insert([shelterData]);

      if (error) throw error;

      setMessage("避難所が正常に追加されました");
      
      // フォームリセット
      setFormData({
        name: "", address: "", latitude: "", longitude: "", capacity: "",
        disaster_flood: false, disaster_earthquake: false, disaster_tsunami: false,
        disaster_landslide: false, disaster_storm_surge: false, disaster_fire: false,
        disaster_inland_flood: false, disaster_volcano: false, current_people: "", phone: "",
        wheelchair_accessible: false, elevator_available: false, slope_available: false,
        braille_block: false, first_floor_access: false, area: "", stock: "",
        email: "", url: "", notes: ""
      });
      
      fetchShelters();
    } catch (error) {
      console.error('避難所の追加に失敗:', error);
      setMessage("避難所の追加に失敗しました: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 避難所を削除
  const handleDelete = async (id) => {
    if (!confirm("この避難所を削除しますか？")) return;

    try {
      const { error } = await supabase
        .from('shelters')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMessage("避難所が削除されました");
      fetchShelters();
    } catch (error) {
      console.error('避難所の削除に失敗:', error);
      setMessage("避難所の削除に失敗しました: " + error.message);
    }
  };

  // 現在の人数を更新
  const handleUpdateCurrentPeople = async (id, newCount) => {
    try {
      const { error } = await supabase
        .from('shelters')
        .update({ current_people: parseInt(newCount) || 0 })
        .eq('id', id);

      if (error) throw error;

      setMessage("現在の避難者数が更新されました");
      fetchShelters();
    } catch (error) {
      console.error('避難者数の更新に失敗:', error);
      setMessage("避難者数の更新に失敗しました: " + error.message);
    }
  };

  // CSVアップロード処理（簡略版）
  const handleCsvUpload = (event) => {
    // CSVアップロード機能は前回と同様の実装
    // ここでは省略
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">避難所管理</h2>

      {/* メッセージ表示 */}
      {message && (
        <div className={`mb-4 p-3 rounded whitespace-pre-line ${
          message.includes("失敗") || message.includes("エラー") 
            ? "bg-red-100 text-red-700" 
            : "bg-green-100 text-green-700"
        }`}>
          {message}
        </div>
      )}

      {/* 新規避難所追加フォーム */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-lg font-semibold mb-6">新しい避難所を追加</h3>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 必須項目セクション */}
          <div className="border-l-4 border-red-500 pl-4">
            <h4 className="text-md font-semibold text-red-700 mb-4">必須項目</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dbColumns.required.map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium mb-1">
                    {field.label} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={field.type}
                    name={field.key}
                    value={formData[field.key]}
                    onChange={handleInputChange}
                    required
                    step={field.type === 'number' ? 'any' : undefined}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 入力推奨項目セクション */}
          <div className="border-l-4 border-yellow-500 pl-4">
            <h4 className="text-md font-semibold text-yellow-700 mb-4">入力推奨項目</h4>
            
            {/* 災害対応 */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">災害対応可能種別</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {dbColumns.recommended.filter(field => field.key.startsWith('disaster_')).map(field => (
                  <label key={field.key} className="flex items-center">
                    <input
                      type="checkbox"
                      name={field.key}
                      checked={formData[field.key]}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="text-sm">{field.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* その他推奨項目 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dbColumns.recommended.filter(field => !field.key.startsWith('disaster_')).map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    name={field.key}
                    value={formData[field.key]}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 補助表示項目セクション */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="text-md font-semibold text-blue-700 mb-4">補助表示項目</h4>
            
            {/* バリアフリー対応 */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">バリアフリー対応</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {dbColumns.auxiliary.filter(field => field.type === 'checkbox').map(field => (
                  <label key={field.key} className="flex items-center">
                    <input
                      type="checkbox"
                      name={field.key}
                      checked={formData[field.key]}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="text-sm">{field.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* その他補助項目 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dbColumns.auxiliary.filter(field => field.type !== 'checkbox' && field.type !== 'textarea').map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    name={field.key}
                    value={formData[field.key]}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
            </div>

            {/* テキストエリア項目 */}
            <div className="grid grid-cols-1 gap-4 mt-4">
              {dbColumns.auxiliary.filter(field => field.type === 'textarea').map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium mb-1">{field.label}</label>
                  <textarea
                    name={field.key}
                    value={formData[field.key]}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 送信ボタン */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full md:w-auto px-8 py-3 rounded-lg text-white font-medium ${
                isLoading 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300"
              }`}
            >
              {isLoading ? "追加中..." : "避難所を追加"}
            </button>
          </div>
        </form>
      </div>

      {/* 避難所一覧 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">登録済み避難所一覧 ({shelters.length}件)</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-2 text-left">名称</th>
                <th className="border p-2 text-left">住所</th>
                <th className="border p-2 text-left">収容人数</th>
                <th className="border p-2 text-left">現在の避難者</th>
                <th className="border p-2 text-left">災害対応</th>
                <th className="border p-2 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {shelters.length === 0 ? (
                <tr>
                  <td colSpan="6" className="border p-4 text-center text-gray-500">
                    登録された避難所がありません
                  </td>
                </tr>
              ) : (
                shelters.map((shelter) => {
                  const stockData = shelter.stock || {};
                  const disasterTypes = stockData.disaster_types || '-';
                  
                  return (
                    <tr key={shelter.id}>
                      <td className="border p-2 font-medium">{shelter.name}</td>
                      <td className="border p-2 text-sm">{shelter.address}</td>
                      <td className="border p-2 text-center">{shelter.capacity || "-"}</td>
                      <td className="border p-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            defaultValue={shelter.current_people || 0}
                            className="w-16 p-1 border rounded text-sm"
                            onBlur={(e) => {
                              if (e.target.value !== (shelter.current_people || 0).toString()) {
                                handleUpdateCurrentPeople(shelter.id, e.target.value);
                              }
                            }}
                          />
                          <span className="text-sm text-gray-500">人</span>
                        </div>
                      </td>
                      <td className="border p-2 text-sm">{disasterTypes}</td>
                      <td className="border p-2">
                        <button
                          onClick={() => handleDelete(shelter.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}