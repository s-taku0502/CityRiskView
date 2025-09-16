"use client";

import React, { useState, useEffect } from 'react';
import BulkShelterImport from './BulkShelterImport';
import SingleShelterForm from './SingleShelterForm';
import ShelterList from './ShelterList';
// supabaseのimport例
import { createClient } from '@supabase/supabase-js';

// supabaseクライアントの初期化（環境変数などで設定してください）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TABS = [
  { key: "bulk", label: "一括インポート用" },
  { key: "single", label: "個別インポート用" },
  { key: "list", label: "避難所一覧" },
];

export default function ShelterManagement() {
  const [activeTab, setActiveTab] = useState("bulk");
  const [shelters, setShelters] = useState([]);

  useEffect(() => {
    fetchShelters();
  }, []);

  const fetchShelters = async () => {
    // supabaseから避難所データを取得
    const { data, error } = await supabase.from('shelters').select('*').order('id', { ascending: true });
    if (!error) setShelters(data || []);
  };

  const handleBulkImport = async (parsedList) => {
    // 一括登録処理（例: upsertでまとめて登録）
    if (parsedList && parsedList.length > 0) {
      await supabase.from('shelters').upsert(parsedList);
    }
    await fetchShelters();
    setActiveTab("list");
  };

  const handleSingleSubmit = async (form) => {
    // 個別登録処理
    await supabase.from('shelters').insert([form]);
    await fetchShelters();
    setActiveTab("list");
  };

  const handleDelete = async (id) => {
    // 削除処理
    await supabase.from('shelters').delete().eq('id', id);
    await fetchShelters();
  };

  return (
    <div className="p-6">
      {/* タブナビゲーション */}
      <div className="flex border-b mb-6">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 -mb-px border-b-2 font-medium transition ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-blue-600"
            }`}
            onClick={() => setActiveTab(tab.key)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* タブごとの内容 */}
      <div>
        {activeTab === "bulk" && (
          <BulkShelterImport onImport={handleBulkImport} />
        )}
        {activeTab === "single" && (
          <SingleShelterForm onSubmit={handleSingleSubmit} />
        )}
        {activeTab === "list" && (
          <ShelterList shelters={shelters} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
}