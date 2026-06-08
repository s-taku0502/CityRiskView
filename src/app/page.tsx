'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import { subscribeFacilities } from '@/lib/realtime'
import type { Facility } from '@/types/facility'
import FacilityDetail from '@/components/FacilityDetail'
import { useCurrentLocation } from '@/hooks/useCurrentLocation'
import { useNearbyFacilities } from '@/hooks/useNearbyFacilities'
import Sidebar from '@/components/layout/Sidebar'
import { OfflineBanner } from '@/components/OfflineBanner'
import {
  isCacheValid,
  getAllFacilities,
  saveFacilities,
  updateFacility,
  getSyncMeta,
} from '@/lib/facilityCache'

// Mapbox GL JS は SSR 非対応のため dynamic import で client-only にする
const Map = dynamic(() => import('@/components/Map'), { ssr: false })

const PAGE_SIZE = 1000
// 全件数の概算（プログレスバーの計算用）
const ESTIMATED_TOTAL = 116200
// 何バッチごとに地図を更新するか（パフォーマンス調整）
const UPDATE_INTERVAL = 5

export default function HomePage() {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  // retry 用カウンター（インクリメントすると useEffect が再実行される）
  const [retryCount, setRetryCount] = useState(0)

  // 近傍リストの表示/非表示
  const [showNearbyList, setShowNearbyList] = useState(false)

  // flyTo トリガー（現在地ボタン押下時に地図を移動）
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom?: number } | null>(null)

  // オフラインモード状態
  const [offlineMode, setOfflineMode] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)

  // 現在地フック
  const { state: locationState, locate } = useCurrentLocation()

  // 現在地が取得できたら近傍検索を実行
  const currentLat = locationState.status === 'success' ? locationState.lat : null
  const currentLng = locationState.status === 'success' ? locationState.lng : null
  const { facilities: nearbyFacilities, loading: nearbyLoading } = useNearbyFacilities({
    lat: currentLat,
    lng: currentLng,
    radiusM: 5000,
    limit: 10,
  })

  // 現在地取得成功時に地図を移動
  useEffect(() => {
    if (locationState.status === 'success') {
      setFlyTo({ lat: locationState.lat, lng: locationState.lng, zoom: 13 })
      setShowNearbyList(true)
    }
  }, [locationState])

  // 初回データ取得（IndexedDB キャッシュ → Supabase の順で試みる）
  useEffect(() => {
    let cancelled = false

    setError(null)
    setLoading(true)
    setLoadingProgress(0)
    setFacilities([])
    setOfflineMode(false)

    async function load() {
      // ── Step 1: IndexedDB キャッシュが有効なら即座に表示 ──
      try {
        const cacheValid = await isCacheValid()
        if (cacheValid) {
          const cached = await getAllFacilities()
          if (cached.length > 0 && !cancelled) {
            setFacilities(cached)
            setLoading(false)
            setLoadingProgress(cached.length)
            // バックグラウンドでオンライン同期を試みる（サイレント更新）
            void backgroundSync(cached.length)
            return
          }
        }
      } catch {
        // IndexedDB 読み取り失敗は無視してオンライン取得に進む
      }

      // ── Step 2: Supabase からオンライン取得 ──
      try {
        const buffer: Facility[] = []
        let from = 0
        let batchCount = 0

        while (true) {
          const { data, error } = await supabase
            .from('facilities')
            .select('*')
            .range(from, from + PAGE_SIZE - 1)

          if (cancelled) return
          if (error) throw new Error(error.message)
          if (!data || data.length === 0) break

          buffer.push(...(data as Facility[]))
          batchCount++

          const isLast = data.length < PAGE_SIZE
          if (batchCount % UPDATE_INTERVAL === 0 || isLast) {
            const snapshot = [...buffer]
            setFacilities(snapshot)
            setLoadingProgress(snapshot.length)
          }
          if (isLast) break
          from += PAGE_SIZE
        }

        // 取得完了後に IndexedDB へ保存（非同期・ノンブロッキング）
        void saveFacilities(buffer).then(async () => {
          if (cancelled) return
          const meta = await getSyncMeta()
          if (meta && !cancelled) setLastSync(meta.lastSync)
        })

        if (!cancelled) setLoading(false)

      } catch (e) {
        if (cancelled) return

        // ── Step 3: オンライン取得失敗 → IndexedDB にフォールバック ──
        try {
          const cached = await getAllFacilities()
          if (cached.length > 0) {
            setFacilities(cached)
            setOfflineMode(true)
            const meta = await getSyncMeta()
            setLastSync(meta?.lastSync ?? null)
            setLoading(false)
            return
          }
        } catch {
          // IndexedDB も失敗
        }

        setError(e instanceof Error ? e.message : '不明なエラー')
        setLoading(false)
      }
    }

    /**
     * バックグラウンド同期
     * キャッシュヒット後にサイレントで最新データを取得・更新する
     */
    async function backgroundSync(cachedCount: number) {
      try {
        const buffer: Facility[] = []
        let from = 0

        while (true) {
          const { data, error } = await supabase
            .from('facilities')
            .select('*')
            .range(from, from + PAGE_SIZE - 1)

          if (cancelled) return
          if (error || !data || data.length === 0) break

          buffer.push(...(data as Facility[]))
          const isLast = data.length < PAGE_SIZE
          if (isLast) break
          from += PAGE_SIZE
        }

        if (buffer.length > 0 && !cancelled) {
          // データが変化していた場合のみ地図を更新
          if (buffer.length !== cachedCount) {
            setFacilities(buffer)
          }
          await saveFacilities(buffer)
          const meta = await getSyncMeta()
          if (meta) setLastSync(meta.lastSync)
        }
      } catch {
        // バックグラウンド同期の失敗はサイレントに無視
      }
    }

    load()
    return () => { cancelled = true }
  }, [retryCount])

  // Realtime 購読：facilities テーブルの UPDATE を受信して状態・IndexedDB を更新
  useEffect(() => {
    const unsubscribe = subscribeFacilities((updated) => {
      setFacilities((prev) =>
        prev.map((f) => (f.id === updated.id ? updated : f))
      )
      // IndexedDB も同期更新
      void updateFacility(updated)
    })
    return unsubscribe
  }, [])

  // ネットワーク復帰時にオフラインモードを解除してリトライ
  useEffect(() => {
    const handleOnline = () => {
      if (offlineMode) {
        setRetryCount((c) => c + 1)
      }
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [offlineMode])

  const handleSelect = useCallback((facility: Facility) => {
    setSelectedId(facility.id)
  }, [])

  const handleClose = useCallback(() => {
    setSelectedId(null)
  }, [])

  const handleRetry = useCallback(() => {
    setRetryCount((c) => c + 1)
  }, [])

  const handleLocate = useCallback(() => {
    locate()
  }, [locate])

  const selectedFacility = facilities.find((f) => f.id === selectedId) ?? null

  // プログレスバーの幅（0〜100%）
  const progressPercent = loading
    ? Math.min(Math.round((loadingProgress / ESTIMATED_TOTAL) * 100), 99)
    : 100

  // 近傍施設のリスト（ハイライト用）
  const nearbyHighlightList = nearbyFacilities

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      {/* オフラインバナー（最上部） */}
      {offlineMode && (
        <OfflineBanner lastSync={lastSync} onRetry={handleRetry} />
      )}

      {/* サイドバー（左上固定・地図の上に重ねる） */}
      <div className={`absolute left-0 z-30 ${offlineMode ? 'top-8' : 'top-0'}`}>
        <Sidebar />
      </div>

      {/* 地図は常に表示（ローディング中も逐次更新される） */}
      <Map
        facilities={facilities}
        selectedId={selectedId}
        onSelect={handleSelect}
        currentLocation={
          locationState.status === 'success'
            ? { lat: locationState.lat, lng: locationState.lng }
            : null
        }
        nearbyFacilities={nearbyHighlightList}
        flyTo={flyTo}
      />

      {/* 現在地ボタン（左下） */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2">
        <button
          onClick={handleLocate}
          disabled={locationState.status === 'loading'}
          className="flex items-center gap-2 bg-white rounded-xl shadow-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          title="現在地を表示"
        >
          {locationState.status === 'loading' ? (
            <svg className="w-4 h-4 text-blue-500 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          )}
          <span>
            {locationState.status === 'loading' ? '取得中...' : '現在地'}
          </span>
        </button>

        {/* 位置情報エラー */}
        {locationState.status === 'error' && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-xs max-w-48">
            {locationState.message}
          </div>
        )}
      </div>

      {/* 近傍避難所リスト（左下・現在地ボタンの上） */}
      {showNearbyList && locationState.status === 'success' && (
        <div className="absolute bottom-20 left-4 z-20 w-72">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-blue-600 text-white">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-semibold">近くの避難所</span>
                <span className="text-xs opacity-80">（5km以内）</span>
              </div>
              <button
                onClick={() => setShowNearbyList(false)}
                className="text-white opacity-70 hover:opacity-100 transition-opacity"
                aria-label="閉じる"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* リスト本体 */}
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
              {nearbyLoading ? (
                <div className="flex items-center justify-center py-6 text-gray-400 text-sm gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  検索中...
                </div>
              ) : nearbyFacilities.length === 0 ? (
                <div className="py-6 text-center text-gray-400 text-sm">
                  5km以内に避難所が見つかりませんでした
                </div>
              ) : (
                nearbyFacilities.map((f, idx) => {
                  const distKm = (f.distance_m / 1000).toFixed(1)
                  const statusColor: Record<string, string> = {
                    open: 'bg-green-100 text-green-700',
                    full: 'bg-red-100 text-red-700',
                    damaged: 'bg-orange-100 text-orange-700',
                    closed: 'bg-gray-100 text-gray-500',
                    unknown: 'bg-gray-100 text-gray-400',
                  }
                  const statusLabel: Record<string, string> = {
                    open: '開設中',
                    full: '満員',
                    damaged: '被害あり',
                    closed: '閉鎖',
                    unknown: '不明',
                  }
                  return (
                    <button
                      key={f.id}
                      onClick={() => {
                        handleSelect(f)
                        setFlyTo({ lat: f.location.coordinates[1], lng: f.location.coordinates[0], zoom: 15 })
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex items-start gap-3"
                    >
                      <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{f.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">{distKm} km</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusColor[f.status] ?? statusColor.unknown}`}>
                            {statusLabel[f.status] ?? '不明'}
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ローディングオーバーレイ（右下・コンパクト） */}
      {loading && (
        <div className="absolute bottom-4 right-4 z-20 pointer-events-none">
          <div className="bg-white rounded-xl shadow-lg px-4 py-3 w-56 pointer-events-auto">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-blue-500 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
              </svg>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-700 truncate">避難所データ読み込み中</p>
                <p className="text-xs text-gray-400">{loadingProgress.toLocaleString()} 件取得済み</p>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-1 text-right text-xs text-gray-400">{progressPercent}%</p>
          </div>
        </div>
      )}

      {/* エラーバナー */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-3 shadow-lg flex items-center gap-3 max-w-sm w-full mx-4">
          <svg className="w-5 h-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div className="flex-1 text-sm">
            <p className="font-semibold">データの取得に失敗しました</p>
            <p className="text-xs text-red-500 mt-0.5">{error}</p>
          </div>
          <button
            onClick={handleRetry}
            className="text-xs text-red-600 underline hover:text-red-800 shrink-0"
          >
            再試行
          </button>
        </div>
      )}

      {/* 施設詳細サイドバー */}
      {selectedFacility && (
        <FacilityDetail
          facility={selectedFacility}
          onClose={handleClose}
        />
      )}
    </main>
  )
}
