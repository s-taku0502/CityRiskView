// 災害・避難所マーカー描画（GeoJSONから）

'use client';

import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import evacuationData from '../data/evacuation.geojson';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function DisasterMap({ map, onSelectFeature }) {
  useEffect(() => {
    if (!map) return;
    if (map.getSource('evacuationPoints')) return;

    map.addSource('evacuationPoints', {
      type: 'geojson',
      data: evacuationData,
    });

    map.addLayer({
      id: 'evacuationPoints-layer',
      type: 'circle',
      source: 'evacuationPoints',
      paint: {
        'circle-radius': 6,
        'circle-color': '#e74c3c',
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff',
      },
    });

    map.on('click', 'evacuationPoints-layer', (e) => {
      const feature = e.features[0];
      onSelectFeature(feature); // ← ここで親に渡す
    });

    map.on('mouseenter', 'evacuationPoints-layer', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'evacuationPoints-layer', () => {
      map.getCanvas().style.cursor = '';
    });
  }, [map, onSelectFeature]);

  return null;
}
