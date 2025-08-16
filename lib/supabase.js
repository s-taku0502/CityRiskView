import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const developerEmail = process.env.NEXT_PUBLIC_DEVELOPER_EMAIL

export const supabase = createClient(supabaseUrl, supabaseKey)

// 管理者権限での書き込み用クライアント
export const getWriteClient = () => {
  if (supabaseServiceKey) {
    return createClient(supabaseUrl, supabaseServiceKey)
  }
  // フォールバック: サービスキーがない場合は通常のクライアントを使用
  return supabase
}