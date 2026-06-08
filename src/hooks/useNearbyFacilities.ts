import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Facility } from '@/types/facility'

export interface NearbyFacility extends Facility {
  /** 現在地からの直線距離（メートル） */
  distance_m: number
}

interface Params {
  lat: number | null
  lng: number | null
  /** 検索半径（メートル）。デフォルト 5000m */
  radiusM?: number
  /** 最大取得件数。デフォルト 10 件 */
  limit?: number
}

/**
 * Supabase PostGIS RPC `nearby_facilities` を呼び出して
 * 現在地から近い順に避難所を返すフック。
 *
 * lat/lng が null の間はクエリを実行しない。
 */
export function useNearbyFacilities({
  lat,
  lng,
  radiusM = 5000,
  limit = 10,
}: Params) {
  const [facilities, setFacilities] = useState<NearbyFacility[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (lat === null || lng === null) return

    let cancelled = false
    setLoading(true)
    setError(null)

    supabase
      .rpc('nearby_facilities', {
        lat,
        lng,
        radius_m: radiusM,
        max_results: limit,
      })
      .then(({ data, error: rpcError }) => {
        if (cancelled) return
        if (rpcError) {
          setError(rpcError.message)
        } else {
          setFacilities((data as NearbyFacility[]) ?? [])
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [lat, lng, radiusM, limit])

  return { facilities, loading, error }
}
