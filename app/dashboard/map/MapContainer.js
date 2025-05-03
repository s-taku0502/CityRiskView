// Mapbox地図のラッパー（スタイル・基本初期化）

'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import DisasterMap from './components/DisasterMap';
import PopupInfo from './components/PopupInfo';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function MapContainer() {
  const mapContainerRef = useRef(null);
  const [map, setMap] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);

  useEffect(() => {
    if (map) return; // すでに作成されている場合はスキップ

    const newMap = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [137.2137, 36.6953], // 初期位置
      zoom: 12,
    });

    setMap(newMap);

    return () => newMap.remove(); // クリーンアップ
  }, [map]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />
      <DisasterMap map={map} onSelectFeature={setSelectedFeature} />
      <PopupInfo feature={selectedFeature} />
    </div>
  );
}
