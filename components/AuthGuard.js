'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthGuard({ children, allowGuest = false }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userType, setUserType] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // ゲストセッションをチェック
        const guestSession = sessionStorage.getItem('guest_session')
        
        if (guestSession) {
          const guestData = JSON.parse(guestSession)
          // ゲストセッションの有効性をチェック
          const isValidGuest = await validateGuestSession(guestData)
          
          if (isValidGuest && allowGuest) {
            setIsAuthenticated(true)
            setUserType('guest')
            setIsLoading(false)
            return
          } else {
            // 無効なゲストセッションを削除
            sessionStorage.removeItem('guest_session')
          }
        }

        // 通常の認証チェック
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          setIsAuthenticated(true)
          setUserType('admin')
        } else {
          setIsAuthenticated(false)
          // ゲストアクセスが許可されていない場合はログイン画面へ
          if (!allowGuest) {
            router.push('/login')
          }
        }
      } catch (error) {
        console.error('認証チェックエラー:', error)
        setIsAuthenticated(false)
        if (!allowGuest) {
          router.push('/login')
        }
      }
      
      setIsLoading(false)
    }

    checkAuth()

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setIsAuthenticated(true)
          setUserType('admin')
        } else {
          setIsAuthenticated(false)
          setUserType(null)
          if (!allowGuest) {
            router.push('/login')
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, allowGuest])

  // ゲストセッションの有効性チェック
  const validateGuestSession = async (guestData) => {
    try {
      const { data, error } = await supabase
        .from('guest_accounts')
        .select('*, event_codes(*)')
        .eq('id', guestData.id)
        .eq('is_active', true)
        .single()

      if (error || !data) return false

      // イベント期間チェック
      const now = new Date()
      const eventCode = data.event_codes
      
      if (eventCode.start_date && new Date(eventCode.start_date) > now) return false
      if (eventCode.end_date && new Date(eventCode.end_date) < now) return false
      
      return true
    } catch (error) {
      console.error('ゲストセッション検証エラー:', error)
      return false
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">認証確認中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated && !allowGuest) {
    return null
  }

  return children
}