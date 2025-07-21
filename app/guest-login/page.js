'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function GuestLoginPage() {
  const [name, setName] = useState('')
  const [eventCode, setEventCode] = useState('GEEK2025_09')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // 既存のゲストアカウントをチェック（管理者でなければスキップ）
  const checkExistingGuest = async () => {
    try {
      const { data: existingGuest, error: checkError } = await supabase
        .from('guest_accounts')
        .select('*')
        .eq('name', name)
        .eq('event_code', eventCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle()

      // RLSでアクセスできない場合は新規作成として扱う
      if (checkError && checkError.code === 'PGRST116') {
        return null
      }
      
      if (checkError) throw checkError
      return existingGuest
    } catch (error) {
      console.warn('既存ゲストチェックをスキップ:', error.message)
      return null
    }
  }

  const handleGuestLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // イベントコードの有効性チェック
      const isValid = await isValidEventCode(eventCode)
      if (!isValid) {
        setError('無効なイベントコードです。コードが正しいか、イベント期間内かご確認ください。')
        setLoading(false)
        return
      }

      // 既存のゲストアカウントをチェック
      const existingGuest = await checkExistingGuest()

      let guestId
      
      if (existingGuest) {
        // 既存アカウントの最終ログイン時間を更新
        const { data: updatedGuest, error: updateError } = await supabase
          .from('guest_accounts')
          .update({ 
            last_login_time: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingGuest.id)
          .select()
          .maybeSingle()

        if (updateError) throw updateError
        guestId = existingGuest.id
      } else {
        // 新規ゲストアカウント作成
        const { data: newGuest, error: insertError } = await supabase
          .from('guest_accounts')
          .insert({
            name,
            event_code: eventCode.toUpperCase(),
            login_time: new Date().toISOString(),
            last_login_time: new Date().toISOString()
          })
          .select()
          .maybeSingle()

        if (insertError) throw insertError
        guestId = newGuest.id
      }

      // セッションストレージにゲスト情報を保存
      sessionStorage.setItem('guest_session', JSON.stringify({
        id: guestId,
        name,
        eventCode: eventCode.toUpperCase(),
        loginTime: new Date().toISOString(),
        isGuest: true
      }))

      // ゲスト専用ダッシュボードへリダイレクト
      router.push('/guest-dashboard')
      
    } catch (error) {
      console.error('Guest login error:', error)
      setError('ログインに失敗しました: ' + error.message)
    }

    setLoading(false)
  }

  // イベントコードの有効性チェック
  const isValidEventCode = async (code) => {
  try {
    const { data, error } = await supabase
      .from('event_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      console.error('Supabase error:', error)
      return false
    }

    if (!data) {
      console.warn('イベントコードが見つかりません')
      return false
    }

    const now = new Date()

    // 開始日と終了日のチェック
    if (data.start_date && new Date(data.start_date) > now) return false
    if (data.end_date && new Date(data.end_date) < now) return false

    // 最大参加者数のチェック
    if (data.max_participants) {
      const { count, error: countError } = await supabase
        .from('guest_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('event_code', code.toUpperCase())
        .eq('is_active', true)

      // 参加者数チェック
      if (countError) {
        console.error('参加者数の取得に失敗しました:', countError)
        return false
      }

      if (count >= data.max_participants) return false
    }

    return true
  } catch (error) {
    console.error('イベントコードの検証中に例外が発生しました:', error)
    return false
  }
}


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            イベント参加者ログイン
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            CityRiskView デモ・イベント用
          </p>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700 text-center">
              閲覧専用モードでアクセスできます
            </p>
          </div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleGuestLogin}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                お名前
              </label>
              <input
                id="name"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="山田太郎"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="eventCode" className="block text-sm font-medium text-gray-700">
                イベントコード
              </label>
              <input
                id="eventCode"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="EVENT2025"
                value={eventCode}
                onChange={(e) => setEventCode(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {loading ? 'ログイン中...' : 'ゲストとしてログイン'}
            </button>
          </div>
          
          <div className="text-center space-y-2">
            <a href="/login" className="text-indigo-600 hover:text-indigo-500 text-sm block">
              管理者としてログイン
            </a>
            <p className="text-xs text-gray-500">
              ゲストモードでは全ての情報を閲覧できますが、データの変更はできません
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}