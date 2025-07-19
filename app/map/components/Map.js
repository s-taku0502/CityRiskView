'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import LocationButton from '@/app/map/components/LocationButton';
import { supabase } from '@/lib/supabase';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function Map({ onShelterSelect }) {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const currentLocationMarker = useRef(null);
  const [evacuationData, setEvacuationData] = useState(null);

  useEffect(() => {
    if (mapInstance.current) return;

    // DOM要素が存在することを確認
    if (!mapContainer.current) {
      console.error('Map container is not available');
      return;
    }

    // 初期化（初期位置：東京駅）
    mapInstance.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [139.7673068, 35.6809591],
      zoom: 15,
      minZoom: 10,
      maxZoom: 18,
      attributionControl: false,
    });

    // マップのロード完了を待つ
    mapInstance.current.on('load', () => {
      // 避難所データをSupabaseから読み込む
      loadSheltersFromSupabase();

      // 現在地を取得
      getCurrentLocation();
    });

    // クリーンアップ
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
      }
    };
  }, []);

  // Supabaseから避難所データを読み込む
  const loadSheltersFromSupabase = async () => {
    try {
      const { data: shelters, error } = await supabase
        .from('shelters')
        .select('*');

      if (error) throw error;

      // mapInstanceが存在することを確認，デバッグ用
      if (!mapInstance.current) {
        console.error('Map instance is not available for adding shelters');
        return;
      }

      // 各避難所にマーカーを追加
      shelters.forEach(shelter => {
        const { latitude, longitude, name, address, capacity, current_people, stock } = shelter;

        let stockItems = [];
        try {
          stockItems = typeof stock === 'string' ? JSON.parse(stock) : stock || [];
        } catch (err) {
          console.warn('備蓄情報のパースに失敗:', err);
        }

        // mapInstanceが存在することを再確認
        if (mapInstance.current) {
          const marker = new mapboxgl.Marker({ color: '#FF0000' })
            .setLngLat([longitude, latitude])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(`
                  <h3 class="font-bold">${name}</h3>
                  <p>${address}</p>
                  <p>収容可能人数: ${capacity}人</p>
                  <p>現在の避難者: ${current_people}人</p>
                  <div class="mt-2">
                    <strong>備蓄情報:</strong>
                    <ul class="list-disc list-inside text-sm">
                      ${stockItems.map(item => `<li>${item.item}: ${item.quantity}</li>`).join('')}
                    </ul>
                  </div>
                `)
            )
            .addTo(mapInstance.current);

          // 管理者画面でのマーカークリック処理
          if (onShelterSelect) {
            marker.getElement().addEventListener('click', () => {
              onShelterSelect(shelter);
            });
          }
        }
      });

      setEvacuationData({ features: shelters });
    } catch (error) {
      console.error('避難所データの読み込みに失敗:', error);
    }
  };

  // 現在地取得のロジックを関数として切り出し
  const getCurrentLocation = () => {
    // mapInstanceが存在することを確認
    if (!mapInstance.current) {
      console.error('Map instance is not available');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // 既存のマーカーを削除
        if (currentLocationMarker.current) {
          currentLocationMarker.current.remove();
        }

        // mapInstanceが再度存在することを確認してからマーカーを作成
        if (!mapInstance.current) {
          console.error('Map instance became unavailable during geolocation');
          return;
        }

        // 新しいマーカーを作成
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

        // mapInstanceが存在することを再度確認してからflyToを実行
        if (mapInstance.current) {
          mapInstance.current.flyTo({
            center: [longitude, latitude],
            zoom: 14,
            essential: true
          });
        }
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
    <div>
      <div className="w-full h-full relative">
        <div ref={mapContainer} className="w-full h-[calc(100vh-200px)] rounded-xl" />
        <LocationButton
          onClick={() => {
            if (mapInstance.current) {
              getCurrentLocation();
            } else {
              console.error('Map is not ready yet');
            }
          }}
        />
      </div>
      <div className="space-y-4">
        <div className="absolute bottom-2 text-xs text-gray-500 bg-white bg-opacity-80 px-2 py-1 rounded">
          © <a href="https://www.mapbox.com/about/maps/" target="_blank" rel="noopener noreferrer" className="underline">Mapbox</a> |
          © <a href="https://www.openstreetmap.org/about/" target="_blank" rel="noopener noreferrer" className="underline">OpenStreetMap</a>
        </div>
      </div>
      {!onShelterSelect && (
        <>
          ページが正しく表示されない場合は、
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-blue-600 font-bold py-2 px-4 rounded"
          >
            こちら
          </button>
          をクリックして再読み込みしてください。
        </>
      )}
    </div>
  );
}