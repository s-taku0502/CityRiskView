'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function Map() {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (mapInstance.current) return;

    // 仮の初期位置（表示を早く）
    mapInstance.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [139.7671, 35.6812], // 東京駅
      zoom: 10,
    });

    // 現在地取得して更新
    navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
      
          // 地図中心を更新
          mapInstance.current?.flyTo({
            center: [longitude, latitude],
            zoom: 13,
            essential: true,
          });
      
          // 現在地マーカーを追加
          new mapboxgl.Marker({ color: 'blue' })
            .setLngLat([longitude, latitude])
            .addTo(mapInstance.current);
        },
        (error) => {
          console.error('現在地の取得に失敗:', error);
        },
        {
          enableHighAccuracy: true, // GPSやWi-Fiなど、最も正確な情報を使う（バッテリー消費あり
          timeout: 10000, // 10秒だけ位置情報取得を待つ（それ以上は待たない）
          maximumAge: 0, // 位置情報をキャッシュから取得しない（常に最新）
        }
      );     
  }, []);

  return (
    <div className="w-full h-full">
      <div ref={mapContainer} className="w-full h-[calc(100vh-200px)] rounded-xl" />
    </div>
  );
}
