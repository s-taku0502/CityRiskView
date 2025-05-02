'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function Map() {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null); // ← マーカー管理用
  const [errorMsg, setErrorMsg] = useState('');

  // 2点間距離（メートル）計算
  const distance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) ** 2 +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // 現在地取得
  const fetchCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('現在地:', latitude, longitude);

        const distFromOsaka = distance(latitude, longitude, 34.6937, 135.5023);
        if (distFromOsaka < 500000) {
          mapInstance.current?.flyTo({
            center: [longitude, latitude],
            zoom: 13,
            essential: true,
          });

          // 移動が終わったらマーカーを追加
          mapInstance.current.once('moveend', () => {
            if (markerRef.current) {
              markerRef.current.remove();
            }

            markerRef.current = new mapboxgl.Marker({ color: 'blue' })
              .setLngLat([longitude, latitude])
              .addTo(mapInstance.current);
          });

          setErrorMsg('');
        }
      },
      (error) => {
        console.error('現在地取得エラー:', error);
        setErrorMsg('現在地の取得に失敗しました。');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    if (mapInstance.current) return;

    mapInstance.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [139.7671, 35.6812], // 東京駅
      zoom: 10,
    });

    fetchCurrentLocation();
  }, []);

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainer} className="w-full h-[calc(100vh-200px)] rounded-xl" />

      {errorMsg && (
        <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded shadow-md z-10">
          {errorMsg}
        </div>
      )}

      {/* <button
        onClick={fetchCurrentLocation}
        className="absolute bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-xl shadow-md hover:bg-blue-700 z-10"
      >
        現在地を再取得
      </button> */}
    </div>
  );
}
