"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";

export default function ShelterManagement() {
  const [shelters, setShelters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    capacity: "",
    current_people: "",
    stock: ""
  });

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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 避難所を追加
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      // stock フィールドはJSONとして扱う場合があるので、適切に処理
      let stockData = null;
      if (formData.stock.trim()) {
        try {
          stockData = JSON.parse(formData.stock);
        } catch {
          // JSONでない場合は文字列として保存
          stockData = formData.stock;
        }
      }

      const { error } = await supabase
        .from('shelters')
        .insert([{
          name: formData.name,
          address: formData.address,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          capacity: parseInt(formData.capacity) || null,
          current_people: parseInt(formData.current_people) || 0,
          stock: stockData
        }]);

      if (error) throw error;

      setMessage("避難所が正常に追加されました");
      setFormData({
        name: "",
        address: "",
        latitude: "",
        longitude: "",
        capacity: "",
        current_people: "",
        stock: ""
      });
      fetchShelters(); // 一覧を再取得
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
      fetchShelters(); // 一覧を再取得
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
      fetchShelters(); // 一覧を再取得
    } catch (error) {
      console.error('避難者数の更新に失敗:', error);
      setMessage("避難者数の更新に失敗しました: " + error.message);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">避難所管理</h2>

      {/* メッセージ表示 */}
      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.includes("失敗") || message.includes("エラー") 
            ? "bg-red-100 text-red-700" 
            : "bg-green-100 text-green-700"
        }`}>
          {message}
        </div>
      )}

      {/* 避難所追加フォーム */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-lg font-semibold mb-4">新しい避難所を追加</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">避難所名 *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="○○小学校体育館"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">住所 *</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="東京都○○区○○1-2-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">緯度 *</label>
            <input
              type="number"
              step="any"
              name="latitude"
              value={formData.latitude}
              onChange={handleInputChange}
              required
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="35.6762"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">経度 *</label>
            <input
              type="number"
              step="any"
              name="longitude"
              value={formData.longitude}
              onChange={handleInputChange}
              required
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="139.6503"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">収容人数</label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">現在の避難者数</label>
            <input
              type="number"
              name="current_people"
              value={formData.current_people}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="0"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">備蓄情報</label>
            <div className="text-sm text-gray-500 mb-2">
              JSON形式: {`{"水": 1000, "毛布": 200}`}
              <br />
              テキスト形式: 1行につき1項目（例: 水: 1000L）
            </div>
            <textarea
              name="stock"
              value={formData.stock}
              onChange={handleInputChange}
              rows="4"
              className="w-full p-2 border border-gray-300 rounded"
              placeholder={`JSON形式:\n{"水": 1000, "毛布": 200}\n\nテキスト形式:\n水: 1000L\n毛布: 200枚\n食料: 500食分`}
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`px-6 py-2 rounded text-white ${
                isLoading 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isLoading ? "追加中..." : "避難所を追加"}
            </button>
          </div>
        </form>
      </div>

      {/* 避難所一覧 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">登録済み避難所一覧</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-2 text-left">ID</th>
                <th className="border p-2 text-left">名称</th>
                <th className="border p-2 text-left">住所</th>
                <th className="border p-2 text-left">緯度</th>
                <th className="border p-2 text-left">経度</th>
                <th className="border p-2 text-left">収容人数</th>
                <th className="border p-2 text-left">現在の避難者</th>
                <th className="border p-2 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {shelters.length === 0 ? (
                <tr>
                  <td colSpan="8" className="border p-4 text-center text-gray-500">
                    登録された避難所がありません
                  </td>
                </tr>
              ) : (
                shelters.map((shelter) => (
                  <tr key={shelter.id}>
                    <td className="border p-2">{shelter.id}</td>
                    <td className="border p-2">{shelter.name}</td>
                    <td className="border p-2">{shelter.address}</td>
                    <td className="border p-2">{shelter.latitude}</td>
                    <td className="border p-2">{shelter.longitude}</td>
                    <td className="border p-2">{shelter.capacity || "-"}</td>
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
                    <td className="border p-2">
                      <button
                        onClick={() => handleDelete(shelter.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}