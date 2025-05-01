// Map.js の変更の試し書き

'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function Map() {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);

  // 2地点の距離（メートル）を計算
  const distance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) ** 2 +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  useEffect(() => {
    if (mapInstance.current) return;

    // 初期化（東京駅を仮の中心）
    mapInstance.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [139.7671, 35.6812],
      zoom: 10,
    });

    // 現在地を取得
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('取得した現在地:', latitude, longitude);

        const distFromOsaka = distance(latitude, longitude, 34.6937, 135.5023);
        // console.log('大阪からの距離:', Math.round(distFromOsaka), 'm');

        if (distFromOsaka < 500000) {
          // flyTo & マーカー追加
          mapInstance.current?.flyTo({
            center: [longitude, latitude],
            zoom: 13,
            essential: true,
          });

          new mapboxgl.Marker({ color: 'blue' })
            .setLngLat([longitude, latitude])
            .addTo(mapInstance.current);
        } else {
          console.warn('取得した位置が異常なためスキップされました。');
        }
      },
      (error) => {
        console.error('現在地の取得に失敗:', error);
      },
      {
        enableHighAccuracy: true, // 高精度な位置情報を取得
        timeout: 10000, // タイムアウト時間（ミリ秒）
        maximumAge: 0, // キャッシュを使用しない
      }
    );
  }, []);

  return (
    <div className="w-full h-full">
      <div ref={mapContainer} className="w-full h-[calc(100vh-200px)] rounded-xl" />
    </div>
  );
}
