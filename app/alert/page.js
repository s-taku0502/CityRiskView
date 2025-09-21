"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// 通知・アラート画面

export default function AlertPage() {
  const [isAdjusting, setIsAdjusting] = useState(false);

  useEffect(() => {
    // Supabaseから調整中状態を取得
    const fetchAdjusting = async () => {
      const { data, error } = await supabase
        .from('ui_adjusting')
        .select('is_adjusting')
        .eq('screen', 'evacuation')
        .single();
      if (!error && data) setIsAdjusting(data.is_adjusting);
    };
    fetchAdjusting();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold">アラート情報（仮）</h2>
      {isAdjusting && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          現在調整中のため、不具合が出る場合があります
        </div>
      )}
    </div>
  );
}
