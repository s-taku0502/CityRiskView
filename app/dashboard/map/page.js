// 地図だけ表示する画面
"use client"; // ← これを追加

// import dynamic from "next/dynamic";
import Map from "@/components/Map";

// const Map = dynamic(() => import("@/components/Map"), { ssr: false });

export default function MapPage() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">🗺️ 現在地マップ</h2>
      <Map />
    </div>
  );
}
