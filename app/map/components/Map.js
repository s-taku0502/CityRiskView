'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import LocationButton from '@/app/map/components/LocationButton';
import { supabase } from '@/lib/supabase';
import { MARKER_COLOR_SHELTER, MARKER_COLOR_CURRENT_LOCATION } from '../constants'; // パスは適宜修正してください

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function Map({ onShelterSelect }) {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const currentLocationMarker = useRef(null);
  const [evacuationData, setEvacuationData] = useState(null);

  // Supabaseから避難所データを読み込む
  const loadSheltersFromSupabase = useCallback(async () => {
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
          // stockItemsが配列でない場合は空配列に設定
          if (!Array.isArray(stockItems)) {
            stockItems = [];
          }
        } catch (err) {
          console.warn('備蓄情報のパースに失敗:', err);
          stockItems = [];
        }

        // mapInstanceが存在することを再確認
        if (mapInstance.current) {
          const marker = new mapboxgl.Marker({ color: MARKER_COLOR_SHELTER })
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
                      ${Array.isArray(stockItems) && stockItems.length > 0 
                        ? stockItems.map(item => `<li>${item.item}: ${item.quantity}</li>`).join('')
                        : '<li>備蓄情報なし</li>'
                      }
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
  }, [onShelterSelect]);

  // 現在地取得のロジックを関数として切り出し
  const getCurrentLocation = useCallback(() => {
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
          color: MARKER_COLOR_CURRENT_LOCATION
        })
          .setLngLat([longitude, latitude])
          .addTo(mapInstance.current);

        // マップを現在地に移動
        mapInstance.current.setCenter([longitude, latitude]);
      },
      (error) => console.error('現在地の取得に失敗:', error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, []);

  useEffect(() => {
    if (mapInstance.current) return;

    // DOM要素が存在することを確認
    if (!mapContainer.current) {
      console.error('Map container is not available');
      return;
    }

    // コンテナの寸法を確認
    const containerRect = mapContainer.current.getBoundingClientRect();
    if (containerRect.width === 0 || containerRect.height === 0) {
      console.warn('Map container has zero dimensions, retrying...');
      setTimeout(() => {
        // 少し待ってから再試行
        if (mapContainer.current && !mapInstance.current) {
          initializeMap();
        }
      }, 100);
      return;
    }

    initializeMap();

    // initializeMapを定義
    function initializeMap() {
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

      // 画像の読み込みエラーをハンドリング
      mapInstance.current.on('styleimagemissing', (e) => {
        console.warn(`Missing map image: ${e.id}`);
        // 代替画像やデフォルト画像を設定することも可能
      });

      // マップの初期化エラーをハンドリング
      mapInstance.current.on('error', (e) => {
        console.error('Mapbox error:', e);
      });
    }
  }, [loadSheltersFromSupabase, getCurrentLocation]);

  return (
    <div>
      <div className="w-full">
        <div className="relative w-full absolute inset-0">
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
          <div className="absolute bottom-6 text-xs text-gray-500 bg-white bg-opacity-80 px-2 py-1 rounded">
            © <a href="https://www.mapbox.com/about/maps/" target="_blank" rel="noopener noreferrer" className="underline">Mapbox</a> |
            © <a href="https://www.openstreetmap.org/about/" target="_blank" rel="noopener noreferrer" className="underline">OpenStreetMap</a>
          </div>
        </div>
      </div>
        ページが正しく表示されない場合は、
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-blue-600 font-bold rounded"
        >
          こちら
        </button>
        をクリックして再読み込みしてください。
    </div>
  );
}