// utils/getPrefCodeFromURL.js

import { separatedPrefectures } from "./prefectures";

/**
 * URLのサブドメイン（例: cityriskview-tokyo.vercel.app）
 * から都道府県コード(pref_code)を取得する
 */
export function getPrefCodeFromURL() {
  if (typeof window === "undefined") return null;

  const host = window.location.hostname; 
  // 例: cityriskview-tokyo.vercel.app
  const subdomain = host.split(".")[0]; 
  // => "cityriskview-tokyo"

  // cityriskview- の後ろを抽出
  const prefSlug = subdomain.replace("cityriskview-", ""); 
  // => "tokyo"

  // prefectures.js 側に英語スラグを定義しておく
  const matched = separatedPrefectures.find(
    (p) => p.slug === prefSlug
  );

  return matched ? matched.code : null;
}
