"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import DefaultPage from "@/app/stock/components/DefaultPage";

export default function StockPage() {
  const [isAdjusting, setIsAdjusting] = useState(false);

  useEffect(() => {
    // Supabaseから調整中状態を取得
    const fetchAdjusting = async () => {
      const { data, error } = await supabase
        .from("ui_adjusting")
        .select("is_adjusting")
        .eq("screen", "stock")
        .single();
      if (!error && data) setIsAdjusting(data.is_adjusting);
    };
    fetchAdjusting();
  }, []);

  return (
    <div>
      {isAdjusting && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          サンプルデータを表示しています。実際の在庫情報とは異なる場合があります。
        </div>
      )}
      <DefaultPage />
    </div>
  );
}