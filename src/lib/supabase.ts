import { createClient, SupabaseClient } from '@supabase/supabase-js'

// モジュールトップレベルでは createClient() を呼ばない。
// SSR（プリレンダリング）時に環境変数が存在しなくてもクラッシュしないよう、
// 初回アクセス時に遅延初期化するシングルトンパターンを採用する。
let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (_client) return _client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Supabase 環境変数が設定されていません。' +
      'NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を .env.local に追加してください。'
    )
  }

  _client = createClient(url, key)
  return _client
}

/**
 * 後方互換のため、既存コードが `supabase.xxx()` と呼べるよう
 * Proxy 経由でシングルトンに委譲する。
 *
 * これにより既存の import { supabase } from '@/lib/supabase' はそのまま動作する。
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
