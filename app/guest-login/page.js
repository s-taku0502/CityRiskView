'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function GuestLoginPage() {
  const [name, setName] = useState('')
  const [eventCode, setEventCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // イベントコードの有効性チェックを更新
  const isValidEventCode = async (code) => {
    try {
      const { data, error } = await supabase
        .from('event_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single()

      if (error) return false

      // 期間チェック
      const now = new Date()
      if (data.start_date && new Date(data.start_date) > now) return false
      if (data.end_date && new Date(data.end_date) < now) return false

      // 参加者数チェック（必要に応じて）
      if (data.max_participants) {
        const { count } = await supabase
          .from('guest_accounts')
          .select('*', { count: 'exact', head: true })
          .eq('event_code', code.toUpperCase())
          .eq('is_active', true)

        if (count >= data.max_participants) return false
      }

      return true
    } catch (error) {
      console.error('Event code validation error:', error)
      return false
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
      const { data: existingGuest, error: checkError } = await supabase
        .from('guest_accounts')
        .select('*')
        .eq('name', name)
        .eq('event_code', eventCode)
        .eq('is_active', true)
        .maybeSingle()

      if (checkError) throw checkError

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
          .single()

        if (updateError) throw updateError
        guestId = existingGuest.id
      } else {
        // 新規ゲストアカウント作成
        const { data: newGuest, error: insertError } = await supabase
          .from('guest_accounts')
          .insert({
            name,
            event_code: eventCode,
            login_time: new Date().toISOString(),
            last_login_time: new Date().toISOString()
          })
          .select()
          .single()

        if (insertError) throw insertError
        guestId = newGuest.id
      }

      // セッションストレージにゲスト情報を保存
      sessionStorage.setItem('guest_session', JSON.stringify({
        id: guestId,
        name,
        eventCode,
        loginTime: new Date().toISOString(),
        isGuest: true
      }))

      // 管理画面へリダイレクト
      router.push('/admin')
      
    } catch (error) {
      console.error('Guest login error:', error)
      setError('ログインに失敗しました: ' + error.message)
    }

    setLoading(false)
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
          
          <div className="text-center">
            <a href="/login" className="text-indigo-600 hover:text-indigo-500 text-sm">
              管理者としてログイン
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}