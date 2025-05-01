// 地図だけ表示する画面
"use client";
import Map from "@/components/Map";

export default function MapPage() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">🗺️ 現在地マップ</h2>
      <Map />
    </div>
  );
}
