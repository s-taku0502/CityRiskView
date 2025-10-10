# CityRiskView

読み：してぃりすくびゅー

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Mapbox](https://img.shields.io/badge/Mapbox-FF5733?style=for-the-badge&logo=mapbox&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 概要

CityRiskViewは、災害時の避難所情報や備蓄状況を可視化・管理できるWebアプリケーションです。  

## 利用方法

[https://cityriskview.vercel.app](https://cityriskview.vercel.app) で公開中ものを利用できます。

## 主な機能

- **避難所マップ表示**  
  - 地図上に避難所をマーカー表示し、詳細情報や備蓄状況を確認できます
  - 現在地がわかる場合、最寄りの避難所をハイライト表示します
  - 現在地を青色のマーカーで、近隣の避難所を赤色のマーカーで表示します

- **備蓄管理**  
  - 管理者は各避難所の備蓄品の在庫数を登録・更新できます
  - ゲストユーザーは閲覧専用で備蓄状況を確認できます

- **避難ルート案内**  
  - 現在地から最寄りの避難所までの距離や徒歩時間を表示します

- **緊急連絡先・災害情報**  
  - 気象庁やNHKなどの災害関連情報へのリンクや、災害用伝言ダイヤルの案内を提供します

- **管理者・開発者向け画面**  
  - 管理者は備蓄・イベント・通知・統計などの管理が可能です
  - 開発者向けにはデータベース監視やリリース情報表示などの機能があります

## 技術スタック

- Next.js（App Router）
- Supabase（データベース・認証）
- Mapbox GL JS（地図表示）
- Tailwind CSS（UIスタイリング）

## ディレクトリ構成例

- `/app/map` ... 地図・避難所関連
- `/app/evacuation` ... 避難情報・ルート案内
- `/app/admin` ... 管理者向け画面
- `/app/developer` ... 開発者向け画面
- `/app/stock` ... 備蓄管理

## ライセンス

本プロジェクトはMITライセンスです。

## 問題を報告する

問題が発生した場合は、[GitHubのIssues](https://github.com/s-taku0502/CityRiskView/issues)に報告してください。

## 開発者

- [sudo](https://s-taku0502.vercel.app)

- [Twitter](https://x.com/ocean_t_umi)

- [GitHub](https://github.com/s-taku0502)

- [Qiita](https://qiita.com/takumi1227)
