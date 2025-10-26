"use client";
import Map from "@/app/map/components/Map";
export default function MapPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">周辺の避難所情報</h2>
      <div className="rounded-lg">
        {/* <p>ただいま地図情報においてメンテナンスをおこなっています。</p> */}
        <Map />
        {/*MapBox 著作権のカスタム表記 */}
      </div>
    </div>
  );
}
