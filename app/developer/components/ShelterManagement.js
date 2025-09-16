"use client";

import React, { useState, useEffect } from 'react';
import BulkShelterImport from './BulkShelterImport';
import SingleShelterForm from './SingleShelterForm';
import ShelterList from './ShelterList';
import { supabase, getWriteClient } from '../../../lib/supabase';

// 読み取りは通常のクライアント、書き込みは管理者権限クライアントを使用します
const writeClient = getWriteClient();

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
      await writeClient.from('shelters').upsert(parsedList);
    }
    await fetchShelters();
    setActiveTab("list");
  };

  const handleSingleSubmit = async (form) => {
    // 個別登録処理（upsertで重複時に更新）
    await supabase.from('shelters').upsert(form);
    await fetchShelters();
    setActiveTab("list");
  };

  const handleDelete = async (id) => {
    if (!confirm("この避難所を削除しますか？")) return;
    try {
      const writeClient = getWriteClient();
      const shelter = shelters.find(s => s.id === id);

      const { error } = await writeClient
        .from('shelters')
        .delete()
        .eq('id', id);
      if (error) throw error;

      // ログ記録
      await logAction('INFO', '避難所が削除されました', { 
        shelterName: shelter?.name || 'Unknown',
        action: 'shelter_deleted',
        shelterId: id
      });

      setMessage("避難所が削除されました");

      // データ再取得
      await Promise.all([
        fetchShelters(),
        fetchAllShelterStocks()
      ]);
    } catch (error) {
      console.error('避難所の削除に失敗:', error);
      setMessage("避難所の削除に失敗しました: " + error.message);
    }
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