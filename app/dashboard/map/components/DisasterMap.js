// 災害・避難所マーカー描画（GeoJSONから）

'use client';

import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import evacuationData from '../data/evacuation.geojson'; // ← これがさっきのGeoJSONファイル

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function DisasterMap({ map }) {
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
      const coords = feature.geometry.coordinates.slice();
      const props = feature.properties;

      const stockList = JSON.parse(props.stock).map(
        (item) => `${item.item}: ${item.quantity}`
      ).join('<br/>');

      const popupHtml = `
        <strong>${props.name}</strong><br/>
        住所: ${props.address}<br/>
        収容人数: ${props.capacity}<br/>
        現在の人数: ${props.current_people}<br/>
        <u>備蓄情報</u><br/>
        ${stockList}
      `;

      new mapboxgl.Popup()
        .setLngLat(coords)
        .setHTML(popupHtml)
        .addTo(map);
    });

    map.on('mouseenter', 'evacuationPoints-layer', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'evacuationPoints-layer', () => {
      map.getCanvas().style.cursor = '';
    });
  }, [map]);

  return null;
}
