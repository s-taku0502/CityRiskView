// 地図コンポーネント

'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function Map() {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (map.current) return; // すでに初期化済みなら何もしない

    // 現在地を取得
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: [longitude, latitude],
          zoom: 13,
        });

        // 現在地にマーカーを追加
        new mapboxgl.Marker()
          .setLngLat([longitude, latitude])
          .addTo(map.current);
      },
      (error) => {
        console.error('現在地の取得に失敗:', error);

        // 取得できない場合は東京駅をデフォルト表示
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: [139.7671, 35.6812], // 東京駅
          zoom: 10,
        });
      }
    );
  }, []);

  return (
    <div className="w-full h-full">
      <div ref={mapContainer} className="w-full h-[600px] rounded-xl shadow-md" />
    </div>
  );
}

