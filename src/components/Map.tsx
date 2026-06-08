'use client'
import { useRef, useCallback, useEffect } from 'react'
import MapGL, { NavigationControl, useMap, Marker } from 'react-map-gl/mapbox'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Facility, FacilityStatus } from '@/types/facility'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

// ステータスに応じたマーカーの色（circle-color 式で使用）
const STATUS_COLOR: Record<FacilityStatus, string> = {
  open: '#22c55e',     // green-500
  closed: '#6b7280',  // gray-500
  full: '#ef4444',    // red-500
  damaged: '#f97316', // orange-500
  unknown: '#a3a3a3', // neutral-400
}

const CIRCLE_COLOR_EXPR: mapboxgl.Expression = [
  'match',
  ['get', 'status'],
  'open',    STATUS_COLOR.open,
  'full',    STATUS_COLOR.full,
  'damaged', STATUS_COLOR.damaged,
  'unknown', STATUS_COLOR.unknown,
  /* default (closed) */ STATUS_COLOR.closed,
]

const SOURCE_ID = 'facilities'
const CLUSTER_LAYER_ID = 'clusters'
const CLUSTER_COUNT_LAYER_ID = 'cluster-count'
const UNCLUSTERED_LAYER_ID = 'unclustered-point'

// 近傍施設ハイライト用
const NEARBY_SOURCE_ID = 'nearby-facilities'
const NEARBY_LAYER_ID = 'nearby-highlight'

interface MapProps {
  facilities: Facility[]
  selectedId: number | null
  onSelect: (facility: Facility) => void
  /** 現在地（緯度・経度）。null の場合は表示しない */
  currentLocation?: { lat: number; lng: number } | null
  /** 近傍施設のリスト（ハイライト表示用） */
  nearbyFacilities?: Facility[]
  /** 地図を指定座標に移動させるトリガー */
  flyTo?: { lat: number; lng: number; zoom?: number } | null
}

/** facilities 配列を GeoJSON FeatureCollection に変換する */
function toGeoJSON(facilities: Facility[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: facilities.map((f) => ({
      type: 'Feature',
      geometry: f.location,
      properties: {
        id: f.id,
        name: f.name,
        status: f.status,
        type: f.type,
        address: f.address,
        capacity: f.capacity,
        current_occupancy: f.current_occupancy,
      },
    })),
  }
}

/** GeoJSON Source とレイヤーをセットアップ / 更新するコンポーネント */
function FacilitiesLayer({
  facilities,
  onSelect,
  nearbyFacilities = [],
}: {
  facilities: Facility[]
  onSelect: (facility: Facility) => void
  nearbyFacilities?: Facility[]
}) {
  const { current: map } = useMap()
  // スタールクロージャを防ぐため、最新の facilities と onSelect を ref で保持する
  const facilitiesRef = useRef<Facility[]>(facilities)
  const onSelectRef = useRef<(facility: Facility) => void>(onSelect)

  // ref を常に最新の値に同期する
  useEffect(() => {
    facilitiesRef.current = facilities
  }, [facilities])

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  // GeoJSON データの更新（facilities が変わるたびに setData を呼ぶ）
  useEffect(() => {
    if (!map) return
    const mbMap = map.getMap()
    const geojson = toGeoJSON(facilities)
    const updateData = () => {
      const existing = mbMap.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined
      if (existing) {
        existing.setData(geojson)
      }
    }
    if (mbMap.isStyleLoaded()) {
      updateData()
    } else {
      mbMap.once('load', updateData)
    }
  }, [map, facilities])

  // 近傍施設ハイライトの更新
  useEffect(() => {
    if (!map) return
    const mbMap = map.getMap()
    const nearbyGeojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: nearbyFacilities
        .map((f) => ({
          type: 'Feature',
          geometry: f.location,
          properties: { id: f.id },
        })),
    }
    const updateNearby = () => {
      const src = mbMap.getSource(NEARBY_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined
      if (src) {
        src.setData(nearbyGeojson)
      }
    }
    if (mbMap.isStyleLoaded()) {
      updateNearby()
    } else {
      mbMap.once('load', updateNearby)
    }
  }, [map, nearbyFacilities])

  // レイヤーとイベントリスナーのセットアップ（初回のみ）
  useEffect(() => {
    if (!map) return
    const mbMap = map.getMap()
    const setup = () => {
      // Source が既にあればスキップ（レイヤーは初回のみ追加）
      if (mbMap.getSource(SOURCE_ID)) return

      // ---- 全施設 Source ----
      mbMap.addSource(SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 12,
        clusterRadius: 50,
      })

      // クラスターの円
      mbMap.addLayer({
        id: CLUSTER_LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#93c5fd', // blue-300: 〜99件
            100, '#3b82f6', // blue-500: 100〜499件
            500, '#1d4ed8', // blue-700: 500件〜
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            18,
            100, 26,
            500, 36,
          ],
          'circle-opacity': 0.85,
        },
      })

      // クラスターの件数ラベル
      mbMap.addLayer({
        id: CLUSTER_COUNT_LAYER_ID,
        type: 'symbol',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 13,
        },
        paint: {
          'text-color': '#ffffff',
        },
      })

      // 個別施設の点
      mbMap.addLayer({
        id: UNCLUSTERED_LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': CIRCLE_COLOR_EXPR,
          'circle-radius': 7,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff',
        },
      })

      // ---- 近傍施設ハイライト Source & Layer ----
      mbMap.addSource(NEARBY_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })

      mbMap.addLayer({
        id: NEARBY_LAYER_ID,
        type: 'circle',
        source: NEARBY_SOURCE_ID,
        paint: {
          'circle-color': 'transparent',
          'circle-radius': 14,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#f59e0b', // amber-400
          'circle-opacity': 0,
          'circle-stroke-opacity': 0.9,
        },
      })

      // クラスタークリック → ズームイン
      mbMap.on('click', CLUSTER_LAYER_ID, (e) => {
        const features = mbMap.queryRenderedFeatures(e.point, { layers: [CLUSTER_LAYER_ID] })
        if (!features.length) return
        const clusterId = features[0].properties?.cluster_id
        const source = mbMap.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || zoom == null) return
          const coords = (features[0].geometry as GeoJSON.Point).coordinates as [number, number]
          mbMap.easeTo({ center: coords, zoom })
        })
      })

      // 個別施設クリック → ref 経由で最新の facilities を参照（スタールクロージャ回避）
      mbMap.on('click', UNCLUSTERED_LAYER_ID, (e) => {
        const features = mbMap.queryRenderedFeatures(e.point, { layers: [UNCLUSTERED_LAYER_ID] })
        if (!features.length) return
        const props = features[0].properties
        if (!props) return
        const facility = facilitiesRef.current.find((f) => f.id === props.id)
        if (facility) onSelectRef.current(facility)
      })

      // カーソルスタイル
      mbMap.on('mouseenter', CLUSTER_LAYER_ID, () => { mbMap.getCanvas().style.cursor = 'pointer' })
      mbMap.on('mouseleave', CLUSTER_LAYER_ID, () => { mbMap.getCanvas().style.cursor = '' })
      mbMap.on('mouseenter', UNCLUSTERED_LAYER_ID, () => { mbMap.getCanvas().style.cursor = 'pointer' })
      mbMap.on('mouseleave', UNCLUSTERED_LAYER_ID, () => { mbMap.getCanvas().style.cursor = '' })
    }

    if (mbMap.isStyleLoaded()) {
      setup()
    } else {
      mbMap.once('load', setup)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]) // 初回のみ実行（facilities は ref 経由で参照するため依存配列に含めない）

  return null
}

/** flyTo プロップが変わったら地図を移動させるコンポーネント */
function FlyToController({
  flyTo,
}: {
  flyTo: { lat: number; lng: number; zoom?: number } | null | undefined
}) {
  const { current: map } = useMap()
  const prevFlyTo = useRef<typeof flyTo>(null)

  useEffect(() => {
    if (!map || !flyTo) return
    // 同じ座標への重複 flyTo を防ぐ
    if (
      prevFlyTo.current?.lat === flyTo.lat &&
      prevFlyTo.current?.lng === flyTo.lng
    ) return
    prevFlyTo.current = flyTo
    map.getMap().flyTo({
      center: [flyTo.lng, flyTo.lat],
      zoom: flyTo.zoom ?? 13,
      speed: 1.4,
    })
  }, [map, flyTo])

  return null
}

export default function Map({
  facilities,
  selectedId,
  onSelect,
  currentLocation,
  nearbyFacilities,
  flyTo,
}: MapProps) {
  const mapRef = useRef(null)

  const handleSelect = useCallback(
    (facility: Facility) => { onSelect(facility) },
    [onSelect]
  )

  return (
    <MapGL
      id="mainMap"
      ref={mapRef}
      initialViewState={{
        longitude: 135.5,
        latitude: 34.7,
        zoom: 5,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      mapboxAccessToken={MAPBOX_TOKEN}
    >
      <NavigationControl position="top-right" />
      <FacilitiesLayer
        facilities={facilities}
        onSelect={handleSelect}
        nearbyFacilities={nearbyFacilities}
      />
      <FlyToController flyTo={flyTo} />

      {/* 現在地マーカー */}
      {currentLocation && (
        <Marker
          longitude={currentLocation.lng}
          latitude={currentLocation.lat}
          anchor="center"
        >
          <div className="relative flex items-center justify-center">
            {/* 外側のパルスリング */}
            <span className="absolute inline-flex h-8 w-8 rounded-full bg-blue-400 opacity-40 animate-ping" />
            {/* 内側の点 */}
            <span className="relative inline-flex h-4 w-4 rounded-full bg-blue-600 border-2 border-white shadow-md" />
          </div>
        </Marker>
      )}
    </MapGL>
  )
}
