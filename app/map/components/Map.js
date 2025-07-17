'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import LocationButton from './LocationButton';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function Map() {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const currentLocationMarker = useRef(null);
  const [evacuationData, setEvacuationData] = useState(null);

  useEffect(() => {
    if (mapInstance.current) return;

    // 初期化（初期位置：東京駅）
    mapInstance.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [139.7673068, 35.6809591],
      zoom: 15,
      minZoom: 10,
      maxZoom: 18,
      attributionControl: false,  // ← この1行を追加
    });

    // マップのロード完了を待つ
    mapInstance.current.on('load', () => {
      // 避難所データを読み込む
      fetch('/data/evacuation.geojson')  // パスを修正
        .then(response => response.json())
        .then(data => {
          setEvacuationData(data);
          // 各避難所にマーカーを追加
          data.features.forEach(feature => {
            const { coordinates } = feature.geometry;
            const { name, address, capacity, current_people } = feature.properties;

            // 座標の順序を修正（[緯度, 経度] -> [経度, 緯度]）
            const [lat, lng] = coordinates;
            
            new mapboxgl.Marker({ color: '#FF0000' })
              .setLngLat([lng, lat])  // 正しい順序で座標をセット
              .setPopup(
                new mapboxgl.Popup({ offset: 25 })
                  .setHTML(`
                    <h3 class="font-bold">${name}</h3>
                    <p>${address}</p>
                    <p>収容可能人数: ${capacity}人</p>
                    <p>現在の避難者: ${current_people}人</p>
                  `)
              )
              .addTo(mapInstance.current);
          });
        })
        .catch(error => console.error('避難所データの読み込みに失敗:', error));

      // 現在地を取得
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          // 既存のマーカーがあれば削除
          if (currentLocationMarker.current) {
            currentLocationMarker.current.remove();
          }

          // 現在地マーカーを追加
          currentLocationMarker.current = new mapboxgl.Marker({ 
            color: '#0000FF',
            scale: 1.2,
            rotation: 0
          })
            .setLngLat([longitude, latitude])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(`
                  <h3 class="font-bold">現在地</h3>
                  <p>緯度: ${latitude.toFixed(6)}</p>
                  <p>経度: ${longitude.toFixed(6)}</p>
                `)
            )
            .addTo(mapInstance.current);

          // 現在地を中心に表示
          mapInstance.current.flyTo({
            center: [longitude, latitude],
            zoom: 14,
            essential: true
          });
        },
        (error) => console.error('現在地の取得に失敗:', error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });

    // クリーンアップ
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
      }
    };
  }, []);

  // 現在地取得のロジックを関数として切り出し
  const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        if (currentLocationMarker.current) {
          currentLocationMarker.current.remove();
        }

        currentLocationMarker.current = new mapboxgl.Marker({ 
          color: '#00AAAA',
          scale: 1.2,
          rotation: 0
        })
          .setLngLat([longitude, latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <h3 class="font-bold">現在地</h3>
                <p>緯度: ${latitude.toFixed(6)}</p>
                <p>経度: ${longitude.toFixed(6)}</p>
              `)
          )
          .addTo(mapInstance.current);

        mapInstance.current.flyTo({
          center: [longitude, latitude],
          zoom: 14,
          essential: true
        });
      },
      (error) => console.error('現在地の取得に失敗:', error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainer} className="w-full h-[calc(100vh-200px)] rounded-xl" />
      <LocationButton onClick={getCurrentLocation} />
    </div>
  );
}