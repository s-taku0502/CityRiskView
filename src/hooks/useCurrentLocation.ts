import { useState, useEffect, useCallback } from 'react'

export type LocationState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; lat: number; lng: number; accuracy: number }
  | { status: 'error'; message: string }

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 60_000,
}

/**
 * ブラウザの Geolocation API を使って現在地を取得するフック。
 * - `locate()` を呼ぶと取得を開始する（初回は自動実行しない）
 * - 取得中は status: 'loading'、成功は status: 'success'、失敗は status: 'error'
 */
export function useCurrentLocation() {
  const [state, setState] = useState<LocationState>({ status: 'idle' })

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ status: 'error', message: '位置情報サービスが利用できません' })
      return
    }
    setState({ status: 'loading' })
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          status: 'success',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        })
      },
      (err) => {
        const messages: Record<number, string> = {
          1: '位置情報の利用が許可されていません',
          2: '位置情報を取得できませんでした',
          3: '位置情報の取得がタイムアウトしました',
        }
        setState({
          status: 'error',
          message: messages[err.code] ?? '位置情報の取得に失敗しました',
        })
      },
      GEO_OPTIONS,
    )
  }, [])

  return { state, locate }
}
