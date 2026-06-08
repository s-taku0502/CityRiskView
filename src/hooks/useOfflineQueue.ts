/**
 * useOfflineQueue.ts
 * Phase C: 管理者操作のオフラインキューイングフック
 *
 * オンライン時は直接 Supabase に送信し、
 * オフライン時は IndexedDB のキューに保存して Background Sync に委ねる。
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Facility } from '@/types/facility'
import {
  enqueuePendingUpdate,
  getPendingUpdates,
  removePendingUpdate,
  type PendingUpdate,
} from '@/lib/facilityCache'

interface UseOfflineQueueReturn {
  /** 施設ステータスを更新（オフライン時はキューに積む） */
  updateFacilityStatus: (
    facilityId: number,
    data: Partial<Facility>
  ) => Promise<{ queued: boolean; error?: string }>
  /** 保留中の操作件数 */
  pendingCount: number
  /** 保留中の操作一覧 */
  pendingUpdates: PendingUpdate[]
  /** 現在オンラインか */
  isOnline: boolean
  /** 保留操作を手動でフラッシュ（オンライン復帰時に呼ぶ） */
  flushQueue: () => Promise<void>
}

export function useOfflineQueue(): UseOfflineQueueReturn {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [pendingUpdates, setPendingUpdates] = useState<PendingUpdate[]>([])

  /**
   * 保留操作を手動でフラッシュ
   * Background Sync API が使えない環境（iOS Safari など）向け
   * NOTE: useEffect の依存配列で参照するため、先に宣言する
   */
  const flushQueue = useCallback(async () => {
    const pending = await getPendingUpdates()
    if (pending.length === 0) return

    const results = await Promise.allSettled(
      pending.map(async (item) => {
        const { error } = await supabase
          .from('facilities')
          .update(item.data)
          .eq('id', item.facilityId)
        if (error) throw new Error(error.message)
        return item.id!
      })
    )

    // 成功したものを IndexedDB から削除
    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 'fulfilled') {
        await removePendingUpdate(pending[i].id!)
      }
    }

    const remaining = await getPendingUpdates()
    setPendingUpdates(remaining)
  }, [])

  // オンライン状態の監視
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // オンライン復帰時に自動フラッシュ
      void flushQueue()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [flushQueue])

  // 保留操作の読み込み
  useEffect(() => {
    getPendingUpdates().then(setPendingUpdates).catch(console.error)
  }, [])

  /**
   * 施設ステータスを更新
   * - オンライン: Supabase に直接 PATCH
   * - オフライン: IndexedDB キューに追加 → Background Sync に委ねる
   */
  const updateFacilityStatus = useCallback(
    async (
      facilityId: number,
      data: Partial<Facility>
    ): Promise<{ queued: boolean; error?: string }> => {
      if (isOnline) {
        // オンライン: 直接送信
        const { error } = await supabase
          .from('facilities')
          .update(data)
          .eq('id', facilityId)

        if (error) {
          // 送信失敗時はキューに積む
          await enqueuePendingUpdate(facilityId, data)
          const updated = await getPendingUpdates()
          setPendingUpdates(updated)
          return { queued: true, error: error.message }
        }
        return { queued: false }
      } else {
        // オフライン: キューに積む
        await enqueuePendingUpdate(facilityId, data)
        const updated = await getPendingUpdates()
        setPendingUpdates(updated)
        return { queued: true }
      }
    },
    [isOnline]
  )

  return {
    updateFacilityStatus,
    pendingCount: pendingUpdates.length,
    pendingUpdates,
    isOnline,
    flushQueue,
  }
}
