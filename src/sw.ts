/// <reference lib="webworker" />
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkFirst, CacheFirst, NetworkOnly } from "serwist";

// serwist のグローバル型定義
declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// ─────────────────────────────────────────────
// Serwist 初期化
// ─────────────────────────────────────────────

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
  runtimeCaching: [
    // Mapbox タイル: NetworkFirst（3秒タイムアウト後キャッシュ）
    {
      matcher: /^https:\/\/.*\.tiles\.mapbox\.com\/.*/i,
      handler: new NetworkFirst({
        cacheName: "mapbox-tiles",
        networkTimeoutSeconds: 3,
        plugins: [
          {
            cacheWillUpdate: async ({ response }) => {
              return response && response.status === 200 ? response : null;
            },
          },
        ],
      }),
    },
    // Mapbox スタイル・グリフ・スプライト: CacheFirst
    {
      matcher: /^https:\/\/api\.mapbox\.com\/(styles|fonts|sprites)\/.*/i,
      handler: new CacheFirst({
        cacheName: "mapbox-assets",
        plugins: [
          {
            cacheWillUpdate: async ({ response }) => {
              return response && response.status === 200 ? response : null;
            },
          },
        ],
      }),
    },
    // 気象庁 XML フィード: NetworkOnly（常に最新を取得）
    {
      matcher: /^https:\/\/www\.data\.jma\.go\.jp\/.*/i,
      handler: new NetworkOnly(),
    },
    // Supabase API: NetworkFirst
    {
      matcher: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: new NetworkFirst({
        cacheName: "supabase-api",
        networkTimeoutSeconds: 5,
        plugins: [
          {
            cacheWillUpdate: async ({ response }) => {
              return response && response.status === 200 ? response : null;
            },
          },
        ],
      }),
    },
    // Next.js 静的アセット: CacheFirst
    {
      matcher: /\/_next\/static\/.*/i,
      handler: new CacheFirst({
        cacheName: "next-static",
      }),
    },
    // 画像: CacheFirst
    {
      matcher: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: new CacheFirst({
        cacheName: "images",
      }),
    },
  ],
});

serwist.addEventListeners();

// ─────────────────────────────────────────────
// Background Sync: 施設更新の自動送信
// ─────────────────────────────────────────────

const SYNC_TAG = "sync-facility-updates";

self.addEventListener("sync", (event) => {
  const syncEvent = event as ExtendableEvent & { tag: string };
  if (syncEvent.tag === SYNC_TAG) {
    syncEvent.waitUntil(flushPendingUpdates());
  }
});

async function flushPendingUpdates(): Promise<void> {
  let db: IDBDatabase;
  try {
    db = await openCRVDB();
  } catch (e) {
    console.error("[SW] IndexedDB open failed:", e);
    return;
  }

  const pending = await getAllFromStore(db);
  if (pending.length === 0) return;

  const supabaseUrl = configStore["SUPABASE_URL"];
  const supabaseKey = configStore["SUPABASE_ANON_KEY"];

  if (!supabaseUrl || !supabaseKey) {
    console.warn("[SW] Supabase config not available, skipping sync");
    return;
  }

  console.log(`[SW] Flushing ${pending.length} pending update(s)...`);

  for (const item of pending) {
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/facilities?id=eq.${item.facilityId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            Prefer: "return=minimal",
          },
          body: JSON.stringify(item.data),
        }
      );

      if (res.ok) {
        await deleteFromStore(db, item.id);
        console.log(`[SW] Synced facility ${item.facilityId}`);
      } else {
        await updateRetryCount(db, item);
        console.warn(
          `[SW] Failed to sync facility ${item.facilityId}: ${res.status}`
        );
      }
    } catch (e) {
      console.error(`[SW] Network error for facility ${item.facilityId}:`, e);
    }
  }
}

// ─────────────────────────────────────────────
// postMessage でクライアントから設定値を受け取る
// ─────────────────────────────────────────────

const configStore: Record<string, string> = {};

self.addEventListener("message", (event) => {
  if (event.data?.type === "SET_CONFIG") {
    const { key, value } = event.data as { type: string; key: string; value: string };
    configStore[key] = value;
  }
});

// ─────────────────────────────────────────────
// IndexedDB ヘルパー
// ─────────────────────────────────────────────

interface PendingItem {
  id: number;
  facilityId: number;
  data: Record<string, unknown>;
  retryCount: number;
}

function openCRVDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("crv-offline", 1);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("pending_updates")) {
        db.createObjectStore("pending_updates", {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };
  });
}

function getAllFromStore(db: IDBDatabase): Promise<PendingItem[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending_updates", "readonly");
    const req = tx.objectStore("pending_updates").getAll();
    req.onsuccess = () => resolve(req.result as PendingItem[]);
    req.onerror = () => reject(req.error);
  });
}

function deleteFromStore(db: IDBDatabase, id: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending_updates", "readwrite");
    const req = tx.objectStore("pending_updates").delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function updateRetryCount(db: IDBDatabase, item: PendingItem): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending_updates", "readwrite");
    const req = tx.objectStore("pending_updates").put({
      ...item,
      retryCount: (item.retryCount || 0) + 1,
    });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ─────────────────────────────────────────────
// Push 通知（将来の拡張用スタブ）
// ─────────────────────────────────────────────

self.addEventListener("push", (event) => {
  const pushEvent = event as PushEvent;
  if (!pushEvent.data) return;
  const data = pushEvent.data.json() as {
    title?: string;
    body?: string;
    tag?: string;
    url?: string;
  };
  pushEvent.waitUntil(
    self.registration.showNotification(data.title || "CityRiskView", {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag || "crv-notification",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  const notifEvent = event as NotificationEvent;
  notifEvent.notification.close();
  notifEvent.waitUntil(
    self.clients.openWindow(
      (notifEvent.notification.data as { url?: string })?.url || "/"
    )
  );
});
