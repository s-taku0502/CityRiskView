// 個別追加・更新用のコンポーネント
import React, { useState } from 'react';

export default function SingleShelterForm({ onSubmit }) {
  const [form, setForm] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    capacity: "",
    notes: ""
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.address) {
      setMessage("名称と住所は必須です");
      return;
    }
    setMessage("");
    if (onSubmit) onSubmit(form);
    setForm({ name: "", address: "", latitude: "", longitude: "", capacity: "", notes: "" });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h3 className="text-lg font-semibold mb-4">避難所を個別に追加・更新</h3>
      {message && <div className="text-red-600 mb-2">{message}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">名称 *</label>
          <input name="name" value={form.name} onChange={handleChange} className="w-full p-2 border rounded" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">住所 *</label>
          <input name="address" value={form.address} onChange={handleChange} className="w-full p-2 border rounded" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">緯度</label>
          <input name="latitude" value={form.latitude} onChange={handleChange} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">経度</label>
          <input name="longitude" value={form.longitude} onChange={handleChange} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">収容人数</label>
          <input name="capacity" value={form.capacity} onChange={handleChange} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">備考</label>
          <input name="notes" value={form.notes} onChange={handleChange} className="w-full p-2 border rounded" />
        </div>
        <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded">登録</button>
      </form>
    </div>
  );
}