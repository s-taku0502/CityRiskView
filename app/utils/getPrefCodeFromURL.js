// app/utils/getPrefCodeFromURL.js

import { separatedPrefectures } from "./prefectures";

/**
 * ホスト名から都道府県コード(pref_code)を取得する（SSR/CSR対応）
 * 対応するホストパターン:
 * - cityriskview-<slug>         (例: cityriskview-tokyo.vercel.app)
 * - city-risk-view-<slug>       (例: city-risk-view-tokyo.vercel.app)
 * - <slug>.cityriskview.*       (例: tokyo.cityriskview.app)
 * - localhost[:port]            (ローカルは null を返す)
 */
export function getPrefCodeFromURL(hostFromSSR) {
  let host = hostFromSSR;

  // クライアントで未指定なら補完
  if (!host && typeof window !== "undefined") {
    host = window.location.hostname;
  }
  if (!host) return null;

  // 小文字化・ポート削除
  host = host.split(":")[0].toLowerCase();

  // ローカルは明示的に null を返す
  if (host === "localhost" || host.startsWith("localhost.")) return null;

  const parts = host.split(".");
  const firstPart = parts[0] || "";
  let prefSlug = null;

  // プレフィックス形式 (cityriskview-*, city-risk-view-*)
  if (firstPart.startsWith("cityriskview-")) {
    prefSlug = firstPart.replace("cityriskview-", "");
  } else if (firstPart.startsWith("city-risk-view-")) {
    prefSlug = firstPart.replace("city-risk-view-", "");
  } else if (host.includes("cityriskview")) {
    // <slug>.cityriskview.* の場合、先頭サブドメインを slug とする
    if (parts.length >= 3) {
      prefSlug = parts[0];
    } else {
      // まれなケースは先頭部分を試す
      prefSlug = firstPart !== "cityriskview" ? firstPart : null;
    }
  } else if (host.includes("city-risk-view")) {
    // city-risk-view ドメイン内の <slug>.city-risk-view.* を想定
    if (parts.length >= 3) {
      prefSlug = parts[0];
    } else {
      prefSlug = firstPart !== "city-risk-view" ? firstPart : null;
    }
  } else {
    // フォールバック: 先頭サブドメインを slug 候補として試す（例: tokyo.example.com）
    prefSlug = firstPart || null;
  }

  if (!prefSlug) return null;

  const matched = separatedPrefectures.find((p) => p.prefName === prefSlug);
  return matched ? matched.code : null;
}
