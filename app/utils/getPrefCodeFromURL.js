// app/utils/getPrefCodeFromURL.js

import { separatedPrefectures } from "./prefectures";

/**
 * ホスト名から都道府県コード(pref_code)を取得する（SSR/CSR対応）
 * 対応するホストパターン:
 * - <slug>.crvmap.app           (例: tokyo.crvmap.app)

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

  // ローカルは明示的に null を返していたが、ローカル用デフォルトがあればそれを返す
  if (host === "localhost" || host.startsWith("localhost.")) {
    const defaultPref = process.env.NEXT_PUBLIC_DEFAULT_PREF || null;
    if (defaultPref) {
      // 数値／ゼロ埋めを既存形式に合わせる（例: 2 -> "02"）
      return String(defaultPref).padStart(2, "0");
    }
    return null;
  }

  const parts = host.split(".");
  const firstPart = parts[0] || "";
  let prefSlug = null;

  // crvmap.app ドメインの場合: <pref>.crvmap.app
  if (host.includes("crvmap.app")) {
    prefSlug = firstPart;
  } else {
    prefSlug = firstPart || null;
  }

  if (!prefSlug) return null;

  // 変更: separatedPrefectures のプロパティ名に合わせて照合
  // 優先順: prefName -> name -> slug (互換フォールバック)
  const matched = separatedPrefectures.find((p) =>
    (p.prefName && p.prefName === prefSlug) ||
    (p.name && p.name === prefSlug) ||
    (p.slug && p.slug === prefSlug)
  );
  return matched ? matched.code : null;
}
