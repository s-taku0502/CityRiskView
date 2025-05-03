// 地図だけ表示する画面
"use client";
import Map from "@/app/dashboard/map/components/Map";
import DisasterMap from "@/app/dashboard/map/components/DisasterMap";

export default function MapPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">🗺️ 現在地マップ</h2>
      <div className="bg-white rounded-lg shadow">
        <Map />
        {/* <DisasterMap /> */}
      </div>
    </div>
  );
}
