// 地図だけ表示する画面
"use client";
import Map from "@/components/Map";

export default function MapPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">🗺️ 現在地マップ</h2>
      <div className="bg-white rounded-lg shadow">
        <Map />
      </div>
    </div>
  );
}
