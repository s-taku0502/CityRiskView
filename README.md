# CityRiskView — デジタルハザードマップ

リアルタイム避難所情報・ハザード情報を表示するデジタルハザードマップです。**オフライン対応（PWA）** を前提として設計されており、災害時のネットワーク断絶下でも最後にキャッシュされた施設情報・地図タイルを表示できます。

## 関連リポジトリ

| リポジトリ | 用途 |
| :--- | :--- |
| **cityriskview**（本リポジトリ） | ハザードマップ・PWA・オフライン対応 |
| [crv-volunteer](https://github.com/s-lifecore/crv-volunteer) | ボランティア向け情報公開（避難所一覧・備蓄・気象アラート） |
| [crv-admin](https://github.com/s-lifecore/crv-admin) | 管理者・開発者ダッシュボード（施設管理・備蓄管理） |

共通の Supabase プロジェクトを使用し、RLS（Row Level Security）で権限を分離しています。

## 技術スタック

- **Next.js 16** + TypeScript
- **Mapbox GL JS v3** — 地図表示・近傍検索
- **Supabase** + PostGIS — 施設データ（`facilities`テーブル）
- **serwist** — Service Worker・PWA・オフラインキャッシュ
- **IndexedDB（idb）** — 施設データのローカルキャッシュ（24時間有効）

## オフライン対応の仕組み

```
1. 初回アクセス時: Supabase から全施設データを取得 → IndexedDB に保存
2. 2回目以降（24時間以内）: IndexedDB から即座に表示 + バックグラウンド差分同期
3. オフライン時: IndexedDB のキャッシュを表示 + OfflineBanner で最終同期日時を通知
```

Mapbox タイルは Service Worker（serwist + Workbox）によって NetworkFirst でキャッシュされます。

## 環境変数

`.env.local` に以下を設定してください。

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
```

## 開発

```bash
pnpm install
pnpm dev
```

## デプロイ

Vercel へのデプロイを推奨します。環境変数を Vercel Dashboard に設定してください。

> **注意**: Mapbox トークンの「Allowed URLs」に Vercel のドメイン（例: `https://crvmap.app`）を追加してください。
