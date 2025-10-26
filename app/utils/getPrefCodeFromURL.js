// app/utils/getPrefCodeFromURL.js

import { separatedPrefectures } from "./prefectures";

/**
 * URLのサブドメイン（例: cityriskview-tokyo.vercel.app）
 * から都道府県コード(pref_code)を取得する
 *
 * SSR（サーバーサイド）とCSR（クライアント）両対応
 */
export function getPrefCodeFromURL(hostFromSSR) {
  let host = hostFromSSR;

  // クライアント側（windowが使える環境）
  if (!host && typeof window !== "undefined") {
    host = window.location.hostname;
  }

  if (!host) return null;

  // 例: cityriskview-tokyo.vercel.app → cityriskview-tokyo
  const subdomain = host.split(".")[0];
  const prefSlug = subdomain.replace("cityriskview-", ""); // "tokyo"

  const matched = separatedPrefectures.find((p) => p.slug === prefSlug);
  return matched ? matched.code : null;
}
