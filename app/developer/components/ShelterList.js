// 登録済み避難所一覧表示用のコンポーネント
import React from 'react';
import { supabase } from '@supabase/auth-ui-shared';
import { createClient } from '@supabase/supabase-js';

// supabaseクライアントの初期化（環境変数などで設定してください）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

export default function ShelterList({ shelters, onDelete }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">登録済み避難所一覧 ({shelters.length}件)</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border p-2 text-left">名称</th>
              <th className="border p-2 text-left">住所</th>
              <th className="border p-2 text-left">収容人数</th>
              <th className="border p-2 text-left">備考</th>
              <th className="border p-2 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {shelters.length === 0 ? (
              <tr>
                <td colSpan="5" className="border p-4 text-center text-gray-500">
                  登録された避難所がありません
                </td>
              </tr>
            ) : (
              shelters.map((shelter) => (
                <tr key={shelter.id}>
                  <td className="border p-2 font-medium">{shelter.name}</td>
                  <td className="border p-2 text-sm">{shelter.address}</td>
                  <td className="border p-2 text-center">{shelter.capacity || "-"}</td>
                  <td className="border p-2 text-sm">{shelter.note || "-"}</td>
                  <td className="border p-2 text-center">
                    <button
                      onClick={() => onDelete(shelter.id)}
                      className="text-red-600 hover:text-red-800"
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
  );
}