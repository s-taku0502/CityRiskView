"use client";

import React, { useState } from "react";
import BulkManagement from "./BulkManagement";
import SingleManagement from "./SingleManagement";
import ShelterView from "./ShelterView";

export default function ShelterManagement() {
  const [mode, setMode] = useState(null);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">避難所管理</h2>
      <div className="flex gap-4 mb-8">
        <button
          className={`px-4 py-2 rounded ${mode === "bulk" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setMode("bulk")}
        >
          一括インポート
        </button>
        <button
          className={`px-4 py-2 rounded ${mode === "single" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setMode("single")}
        >
          個別インポート
        </button>
        <button
          className={`px-4 py-2 rounded ${mode === "view" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setMode("view")}
        >
          避難所確認
        </button>
      </div>
      {mode === "bulk" && <BulkManagement />}
      {mode === "single" && <SingleManagement />}
      {mode === "view" && <ShelterView />}
      {!mode && (
        <div className="text-gray-500 mt-8">上のボタンから操作を選択してください。</div>
      )}
    </div>
  );
}