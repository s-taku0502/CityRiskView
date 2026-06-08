import { supabase } from './supabase'
import type { Facility } from '@/types/facility'

/**
 * facilities テーブルの UPDATE イベントを購読する。
 * @param onUpdate 更新された施設データを受け取るコールバック
 * @returns チャンネルの unsubscribe 関数
 */
export function subscribeFacilities(onUpdate: (facility: Facility) => void) {
  const channel = supabase
    .channel('facilities-realtime')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'facilities' },
      (payload) => {
        onUpdate(payload.new as Facility)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}