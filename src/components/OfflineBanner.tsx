'use client'

import { useState, useEffect } from 'react'

interface OfflineBannerProps {
  /** 最終同期日時（ISO 8601 文字列） */
  lastSync: string | null
  /** 手動再試行ボタンのコールバック */
  onRetry?: () => void
}

/**
 * OfflineBanner
 * オフラインモード時に画面上部に表示するバナー。
 * - 最終同期日時を表示
 * - ネットワーク復帰を検知して自動的に非表示
 * - 手動再試行ボタン付き
 */
export function OfflineBanner({ lastSync, onRetry }: OfflineBannerProps) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetry = async () => {
    if (retrying) return
    setRetrying(true)
    onRetry?.()
    // 1.5秒後にリトライ状態を解除
    setTimeout(() => setRetrying(false), 1500)
  }

  const formattedSync = lastSync
    ? new Date(lastSync).toLocaleString('ja-JP', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div
      role="alert"
      aria-live="polite"
      className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between gap-2 bg-amber-500 text-white px-4 py-1.5 text-xs font-medium shadow-sm"
    >
      {/* 左: アイコン + メッセージ */}
      <div className="flex items-center gap-1.5 min-w-0">
        {isOnline ? (
          // オンライン復帰中（同期待ち）
          <svg className="w-3.5 h-3.5 shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
          </svg>
        ) : (
          // オフライン
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M12 12h.01M3 3l18 18" />
          </svg>
        )}
        <span className="truncate">
          {isOnline ? '接続を確認中...' : 'オフラインモード'}
          {formattedSync && (
            <span className="opacity-80 ml-1.5">
              最終同期: {formattedSync}
            </span>
          )}
        </span>
      </div>

      {/* 右: 再試行ボタン */}
      {onRetry && (
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="shrink-0 underline underline-offset-2 opacity-90 hover:opacity-100 disabled:opacity-50 transition-opacity"
          aria-label="データを再取得する"
        >
          {retrying ? '再取得中...' : '再取得'}
        </button>
      )}
    </div>
  )
}
