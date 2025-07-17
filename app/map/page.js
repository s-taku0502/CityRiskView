// 地図だけ表示する画面
// これはMVP機能に含まれています。
/*
1. 災害リスクの視覚的把握
災害レイヤー（洪水、地震、土砂崩れなど）を地図上に表示。

地図上での危険エリアの視覚化。

凡例（Legend）により、災害の種類やリスクレベルを切り替え可能。

2. 避難所情報の表示
避難所をマーカー表示し、クリックで**詳細情報（PopupInfo）**を表示。

避難所ごとの備蓄情報や定員状況の可視化。

3. ユーザーの現在地と避難所の距離
useCurrentLocation を用いて現在地を取得。

避難所までの**距離計算（utils/distance）**を行い、最寄りの避難所を判断可能にする。

4. 地図UIとしての操作性
地図のパン・ズームやレイヤー切り替え、現在地ボタンなど基本操作機能を搭載。

将来的には経路案内や混雑度表示などの追加拡張も想定。

想定図： @/image/ideal.png
*/


"use client";
import Map from "@/app/map/components/Map";
export default function MapPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">周辺の避難所情報</h2>
      <div className="rounded-lg shadow">
        {/* <p>ただいま地図情報においてメンテナンスをおこなっています。</p> */}
        <Map />
        {/*MapBox 著作権のカスタム表記 */}
        <div className="absolute bottom-2 text-xs text-gray-500 bg-white bg-opacity-80 px-2 py-1 rounded">
          © <a href="https://www.mapbox.com/about/maps/" target="_blank" rel="noopener noreferrer" className="underline">Mapbox</a> |
          © <a href="https://www.openstreetmap.org/about/" target="_blank" rel="noopener noreferrer" className="underline">OpenStreetMap</a>
        </div>
      </div>
      ページが正しく表示されない場合は、
      <button
        onClick={() => window.location.reload()}
        className="mt-2 text-blue-600 font-bold py-2 px-4 rounded"
      >
        こちら
      </button>
      をクリックして再読み込みしてください。
    </div>
  );
}
