/**
 * facilityCache.ts
 * IndexedDB を使った facilities データのオフラインキャッシュ管理。
 *
 * - idb ライブラリを使用して型安全な IndexedDB 操作を実現
 * - キャッシュ有効期限: 24時間
 * - iOS Safari のストレージ制限を考慮した都道府県単位の分割保存に対応
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Facility } from '@/types/facility'

// ─────────────────────────────────────────────
// スキーマ定義
// ─────────────────────────────────────────────

interface CRVSchema extends DBSchema {
  /** 施設データ本体 */
  facilities: {
    key: number
    value: Facility
    indexes: {
      'by-municipality': string
      'by-status': string
      'by-prefecture': number
    }
  }
  /** 同期メタデータ */
  meta: {
    key: string
    value: SyncMeta
  }
  /** オフライン中の保留操作キュー（Phase C: Background Sync 用） */
  pending_updates: {
    key: number
    value: PendingUpdate
    indexes: {
      'by-created': string
    }
  }
}

export interface SyncMeta {
  lastSync: string    // ISO 8601
  count: number
  version: number     // スキーマバージョン（将来の移行用）
}

export interface PendingUpdate {
  id?: number         // IndexedDB の autoIncrement キー
  facilityId: number
  data: Partial<Facility>
  createdAt: string   // ISO 8601
  retryCount: number
}

// ─────────────────────────────────────────────
// 定数
// ─────────────────────────────────────────────

const DB_NAME = 'crv-offline'
const DB_VERSION = 1
const CACHE_TTL_MS = 24 * 60 * 60 * 1000  // 24時間

// ─────────────────────────────────────────────
// DB 初期化
// ─────────────────────────────────────────────

let dbPromise: Promise<IDBPDatabase<CRVSchema>> | null = null

function getDB(): Promise<IDBPDatabase<CRVSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<CRVSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // facilities ストア
        const facilityStore = db.createObjectStore('facilities', { keyPath: 'id' })
        facilityStore.createIndex('by-municipality', 'municipality')
        facilityStore.createIndex('by-status', 'status')
        facilityStore.createIndex('by-prefecture', 'prefecture_id')

        // meta ストア
        db.createObjectStore('meta')

        // pending_updates ストア（Background Sync 用）
        const pendingStore = db.createObjectStore('pending_updates', {
          keyPath: 'id',
          autoIncrement: true,
        })
        pendingStore.createIndex('by-created', 'createdAt')
      },
      blocked() {
        console.warn('[CRV Cache] DB upgrade blocked. Please close other tabs.')
      },
      blocking() {
        dbPromise = null
      },
    })
  }
  return dbPromise
}

// ─────────────────────────────────────────────
// 施設データ操作
// ─────────────────────────────────────────────

/**
 * 施設データを全件保存（差分更新）
 * バッチサイズを分割してメモリ圧迫を防ぐ
 */
export async function saveFacilities(facilities: Facility[]): Promise<void> {
  const db = await getDB()
  const BATCH = 2000

  for (let i = 0; i < facilities.length; i += BATCH) {
    const chunk = facilities.slice(i, i + BATCH)
    const tx = db.transaction('facilities', 'readwrite')
    await Promise.all(chunk.map((f) => tx.store.put(f)))
    await tx.done
  }

  // 同期メタデータを更新
  await db.put('meta', {
    lastSync: new Date().toISOString(),
    count: facilities.length,
    version: DB_VERSION,
  }, 'sync')
}

/** 全件取得 */
export async function getAllFacilities(): Promise<Facility[]> {
  const db = await getDB()
  return db.getAll('facilities')
}

/** 都道府県 ID で絞り込み取得（iOS Safari 向け分割保存の場合に使用） */
export async function getFacilitiesByPrefecture(prefectureId: number): Promise<Facility[]> {
  const db = await getDB()
  return db.getAllFromIndex('facilities', 'by-prefecture', prefectureId)
}

/** 単件更新（リアルタイム更新受信時） */
export async function updateFacility(facility: Facility): Promise<void> {
  const db = await getDB()
  await db.put('facilities', facility)
}

/** キャッシュ件数を取得 */
export async function getCachedCount(): Promise<number> {
  const db = await getDB()
  return db.count('facilities')
}

// ─────────────────────────────────────────────
// 同期メタデータ操作
// ─────────────────────────────────────────────

/** 最終同期メタデータを取得 */
export async function getSyncMeta(): Promise<SyncMeta | undefined> {
  const db = await getDB()
  return db.get('meta', 'sync')
}

/**
 * キャッシュが有効か判定
 * - 24時間以内に同期済み、かつ 1件以上のデータがある場合に有効
 */
export async function isCacheValid(): Promise<boolean> {
  const meta = await getSyncMeta()
  if (!meta || meta.count === 0) return false
  const diff = Date.now() - new Date(meta.lastSync).getTime()
  return diff < CACHE_TTL_MS
}

/** キャッシュを全件削除（強制リフレッシュ用） */
export async function clearCache(): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['facilities', 'meta'], 'readwrite')
  await tx.objectStore('facilities').clear()
  await tx.objectStore('meta').clear()
  await tx.done
}

// ─────────────────────────────────────────────
// Phase C: Background Sync 用の保留操作キュー
// ─────────────────────────────────────────────

/**
 * オフライン中の操作をキューに追加
 * （管理者が混雑度を更新した場合など）
 */
export async function enqueuePendingUpdate(
  facilityId: number,
  data: Partial<Facility>
): Promise<void> {
  const db = await getDB()
  await db.add('pending_updates', {
    facilityId,
    data,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  })

  // Background Sync API が利用可能な場合は登録
  // 'sync' in registration で判定する方が SW 仕様に準拠（iOS Safari 対策）
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready
    if ('sync' in registration) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (registration as any).sync.register('sync-facility-updates')
    }
  }
}

/** 保留中の操作を全件取得 */
export async function getPendingUpdates(): Promise<PendingUpdate[]> {
  const db = await getDB()
  return db.getAll('pending_updates')
}

/** 保留操作を削除（送信成功後） */
export async function removePendingUpdate(id: number): Promise<void> {
  const db = await getDB()
  await db.delete('pending_updates', id)
}

/** リトライカウントをインクリメント */
export async function incrementRetryCount(id: number): Promise<void> {
  const db = await getDB()
  const item = await db.get('pending_updates', id)
  if (item) {
    await db.put('pending_updates', { ...item, retryCount: item.retryCount + 1 })
  }
}
