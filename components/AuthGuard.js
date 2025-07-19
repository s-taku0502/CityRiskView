'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthGuard({ children }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userInfo, setUserInfo] = useState(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // 通常の認証をチェック
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setIsAuthenticated(true)
        setUserInfo({ type: 'admin', user })
      } else {
        // ゲストセッションをチェック
        const guestSession = sessionStorage.getItem('guest_session')
        if (guestSession) {
          const guestData = JSON.parse(guestSession)
          
          // ゲストアカウントの有効性をDBで確認
          const { data: guestAccount, error } = await supabase
            .from('guest_accounts')
            .select('*')
            .eq('id', guestData.id)
            .eq('is_active', true)
            .single()

          if (!error && guestAccount) {
            setIsAuthenticated(true)
            setUserInfo({ type: 'guest', guest: guestData })
          } else {
            // 無効なゲストセッション
            sessionStorage.removeItem('guest_session')
            router.push('/guest-login')
          }
        } else {
          router.push('/login')
        }
      }
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/login')
    }

    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div>
      {/* ユーザー情報表示（オプション） */}
      {userInfo && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-sm">
          {userInfo.type === 'admin' ? (
            <span>管理者: {userInfo.user.email}</span>
          ) : (
            <span>ゲスト: {userInfo.guest.name} (イベント: {userInfo.guest.eventCode})</span>
          )}
        </div>
      )}
      {children}
    </div>
  )
}