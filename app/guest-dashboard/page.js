'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import Map from '@/app/map/page'
import StockManagement from '@/app/admin/components/StockManagement'
import { supabase } from '@/lib/supabase'

export default function GuestDashboard() {
  const [currentView, setCurrentView] = useState('map')
  const [selectedShelter, setSelectedShelter] = useState(null)
  const [shelters, setShelters] = useState([])
  const [guestInfo, setGuestInfo] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const initializeGuest = async () => {
      // ゲスト情報を取得
      const guestSession = sessionStorage.getItem('guest_session')
      if (!guestSession) {
        router.push('/guest-login')
        return
      }

      const guestData = JSON.parse(guestSession)
      setGuestInfo(guestData)

      // 避難所データを取得
      await fetchShelters()
    }

    initializeGuest()
  }, [router])

  const fetchShelters = async () => {
    try {
      const { data: shelters, error } = await supabase
        .from('shelters')
        .select('*')

      if (error) throw error
      setShelters(shelters || [])
    } catch (error) {
      console.error('避難所データ取得エラー:', error)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('guest_session')
    router.push('/guest-login')
  }

  const renderContent = () => {
    switch (currentView) {
      case 'stock':
        return <StockManagement selectedShelter={selectedShelter} isGuest={true} />
      case 'info':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">イベント情報</h3>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="font-medium text-blue-900">参加中のイベント</h4>
                <p className="text-blue-700 mt-1">
                  イベントコード: <span className="font-mono font-bold">{guestInfo?.eventCode}</span>
                </p>
                <p className="text-blue-700 text-sm mt-2">
                  ログイン時刻: {guestInfo?.loginTime ? new Date(guestInfo.loginTime).toLocaleString('ja-JP') : '不明'}
                </p>
              </div>
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h4 className="font-medium text-green-900">利用可能な機能</h4>
                <ul className="text-green-700 text-sm mt-2 space-y-1">
                  <li>• マップ表示と避難所情報の確認</li>
                  <li>• 各避難所の備蓄状況の閲覧</li>
                  <li>• リアルタイムでの在庫状況確認</li>
                </ul>
              </div>
            </div>
          </div>
        )
      default:
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="w-full">
              <Map onShelterSelect={setSelectedShelter} shelters={shelters} />
            </div>
          </div>
        )
    }
  }

  if (!guestInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">ゲスト情報を確認中...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard allowGuest={true}>
      <div className="min-h-screen bg-gray-100">
        {/* ヘッダー */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  CityRiskView - ゲストモード
                </h1>
                <p className="text-sm text-orange-600 font-medium">
                  閲覧専用 | {guestInfo.name} さん
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {selectedShelter && (
                  <span className="text-sm text-gray-600">
                    選択中: {selectedShelter.name}
                  </span>
                )}
                <span className="text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded">
                  {guestInfo.eventCode}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  ログアウト
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 左側: ナビゲーション */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  閲覧機能
                </h2>

                <div className="space-y-3">
                  <button
                    onClick={() => setCurrentView('map')}
                    className={`w-full px-4 py-2 rounded-md text-sm font-medium ${
                      currentView === 'map'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    🗺️ マップ表示
                  </button>

                  <button
                    onClick={() => setCurrentView('stock')}
                    className={`w-full px-4 py-2 rounded-md text-sm font-medium ${
                      currentView === 'stock'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    📦 備蓄状況
                  </button>

                  <button
                    onClick={() => setCurrentView('info')}
                    className={`w-full px-4 py-2 rounded-md text-sm font-medium ${
                      currentView === 'info'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ℹ️ イベント情報
                  </button>
                </div>

                {/* ゲスト向けの説明 */}
                <div className="mt-6 p-3 bg-orange-50 border border-orange-200 rounded-md">
                  <h4 className="text-sm font-medium text-orange-800 mb-2">
                    ゲストモードについて
                  </h4>
                  <ul className="text-xs text-orange-700 space-y-1">
                    <li>• 全ての情報を閲覧できます</li>
                    <li>• データの変更はできません</li>
                    <li>• リアルタイム更新対応</li>
                    <li>• 管理者機能は利用できません</li>
                  </ul>
                </div>

                {/* 管理者ログインへのリンク */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <a
                    href="/login"
                    className="block w-full text-center text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    管理者としてログイン
                  </a>
                </div>
              </div>
            </div>

            {/* 右側: メインコンテンツ */}
            <div className="lg:col-span-3">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}