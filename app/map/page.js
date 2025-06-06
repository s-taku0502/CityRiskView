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
import DisasterMap from "@/app/map/components/DisasterMap";

export default function MapPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">🗺️ 現在地マップ</h2>
      <div className="rounded-lg shadow">
        <p>ただいま地図情報においてメンテナンスをおこなっています。</p>
        {/* <Map /> */}
        {/* <DisasterMap /> */}
      </div>
    </div>
  );
}
