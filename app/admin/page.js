'use client'

import { useState, useEffect } from 'react'
import AuthGuard from '@/components/AuthGuard'
import Map from '@/app/map/page'
import StockManagement from './components/StockManagement'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const [currentView, setCurrentView] = useState('map')
  const [selectedShelter, setSelectedShelter] = useState(null) // ← 復活
  const [shelters, setShelters] = useState([])
  const router = useRouter()

  useEffect(() => {
    const fetchShelters = async () => {
      const { data: shelters, error } = await supabase
        .from('shelters')
        .select('*');

      if (error) {
        console.error('Error fetching shelters:', error)
      } else {
        setShelters(shelters)
      }
    }

    fetchShelters()
  }, [])

  const handleLogout = async () => {
    // ゲストセッションをチェック
    const guestSession = sessionStorage.getItem('guest_session')
    
    if (guestSession) {
      // ゲストセッションを削除
      sessionStorage.removeItem('guest_session')
      router.push('/guest-login')
    } else {
      // 通常のログアウト
      await supabase.auth.signOut()
      router.push('/login')
    }
  }

  const renderContent = () => {
    switch (currentView) {
      case 'stock':
        return <StockManagement selectedShelter={selectedShelter} />
      case 'qr':
        return <div className="bg-white rounded-lg shadow p-6">QRスキャン機能（開発中）</div>
      case 'alerts':
        return <div className="bg-white rounded-lg shadow p-6">通知管理（開発中）</div>
      case 'stats':
        return <div className="bg-white rounded-lg shadow p-6">統計表示（開発中）</div>
      default:
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="w-full">
              <Map onShelterSelect={setSelectedShelter} shelters={shelters} /> {/* ← 修正 */}
            </div>
          </div>
        )
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-100">
        {/* ヘッダー */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl">
            <div className="flex justify-between items-center py-1">
              <h1 className="text-2xl font-bold text-gray-900">
                CityRiskView 管理画面
              </h1>
              <div className="flex items-center">
                {selectedShelter && (
                  <span className="text-sm text-gray-600">
                    選択中: {selectedShelter.name}
                  </span>
                )}
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
        <main className="max-w-7xl py-1">
          <div className="py-1">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* 左側: 管理パネル */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    管理機能
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
                      マップ表示
                    </button>
                    
                    <button
                      onClick={() => setCurrentView('stock')}
                      className={`w-full px-4 py-2 rounded-md text-sm font-medium ${
                        currentView === 'stock'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      備蓄管理
                    </button>
                    
                    <button
                      onClick={() => setCurrentView('qr')}
                      className={`w-full px-4 py-2 rounded-md text-sm font-medium ${
                        currentView === 'qr'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      QRスキャン
                    </button>
                    
                    <button
                      onClick={() => setCurrentView('alerts')}
                      className={`w-full px-4 py-2 rounded-md text-sm font-medium ${
                        currentView === 'alerts'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      通知管理
                    </button>
                    
                    <button
                      onClick={() => setCurrentView('stats')}
                      className={`w-full px-4 py-2 rounded-md text-sm font-medium ${
                        currentView === 'stats'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      統計表示
                    </button>
                  </div>
                </div>
              </div>

              {/* 右側: メインコンテンツ */}
              <div className="lg:col-span-3">
                {renderContent()}
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
