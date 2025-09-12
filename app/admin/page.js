'use client'

import { useState, useEffect } from 'react'
import AuthGuard from '@/components/AuthGuard'
import Map from '@/app/map/page'
import StockManagement from './components/StockManagement'
import EventCodeManagement from './components/EventCodeManagement'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import GitHubReleaseInfo from './components/GitHubReleaseInfo'

export default function AdminPage() {
  const [currentView, setCurrentView] = useState('map')
  const [selectedShelter, setSelectedShelter] = useState(null)
  const [shelters, setShelters] = useState([])
  const [userInfo, setUserInfo] = useState(null)
  const [isDeveloper, setIsDeveloper] = useState(false)
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

    const checkUserType = async () => {
      // 開発者権限チェック（直接指定）
      const { data: { user } } = await supabase.auth.getUser()
      const developerEmails = ['sudoproject.personal@gmail.com']  // 直接指定
      
      console.log('Current user:', user?.email)  // デバッグ用
      console.log('Developer emails:', developerEmails)  // デバッグ用
      
      if (user && developerEmails.includes(user.email)) {
        setIsDeveloper(true)
        console.log('Developer access granted!')  // デバッグ用
      } else {
        console.log('Not a developer')  // デバッグ用
      }
      
      setUserInfo({ type: 'admin' })
    }

    fetchShelters()
    checkUserType()
  }, [])

  const handleLogout = async () => {
    // 通常のログアウト
    await supabase.auth.signOut()
    router.push('/login')
  }

  const renderContent = () => {
    switch (currentView) {
      case 'stock':
        return <StockManagement selectedShelter={selectedShelter} />
      case 'qr':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">QRスキャン機能</h3>
            <p>QRスキャン機能（開発中）</p>
          </div>
        )
      case 'events':
        return <EventCodeManagement />
      case 'alerts':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">通知管理</h3>
            <p>通知管理（開発中）</p>
          </div>
        )
      case 'stats':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">Google Analytics統計</h3>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">📊 利用状況分析</h4>
                <p className="text-sm text-blue-700">
                  Google Analyticsにより、サイトのアクセス状況、ページビュー、ユーザー行動を分析しています。
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">🎯 データ収集項目</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• ページビュー数</li>
                  <li>• セッション数</li>
                  <li>• ユーザー数（匿名）</li>
                  <li>• 滞在時間</li>
                  <li>• デバイス・ブラウザ情報</li>
                </ul>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">📈 改善への活用</h4>
                <p className="text-sm text-yellow-700">
                  収集したデータは、システムの使いやすさの向上と機能改善に活用されます。
                  個人を特定できる情報は収集していません。
                </p>
              </div>
            </div>
          </div>
        )
      case 'analytics':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">Google Analytics ダッシュボード</h3>
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <p className="text-gray-600 mb-4">
                Google Analytics ダッシュボードにアクセスするには、
                <br />以下のリンクからGoogle Analyticsコンソールをご利用ください。
              </p>
              <a
                href="https://analytics.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                📊 Google Analytics を開く
              </a>
            </div>
          </div>
        )
      case 'release':
        return <GitHubReleaseInfo />
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

  const isGuest = userInfo?.type === 'guest'

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-100">
        {/* ヘッダー */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  CityRiskView 管理画面
                </h1>
                {isGuest && (
                  <p className="text-sm text-orange-600 font-medium">
                    ゲストモード - 閲覧専用
                  </p>
                )}
                {/* デバッグ情報を一時的に表示 */}
                <p className="text-xs text-gray-500">
                  開発者権限: {isDeveloper ? 'あり' : 'なし'}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {/* 開発者画面へのボタン */}
                {isDeveloper && (
                  <button
                    onClick={() => router.push('/developer')}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                  >
                    開発者画面
                  </button>
                )}
                
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
                      className={`w-full px-4 py-2 rounded-md text-sm font-medium ${currentView === 'map'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      マップ表示
                    </button>

                    <button
                      onClick={() => setCurrentView('stock')}
                      className={`w-full px-4 py-2 rounded-md text-sm font-medium ${currentView === 'stock'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      備蓄管理
                    </button>

                    <button
                      onClick={() => setCurrentView('qr')}
                      className={`w-full px-4 py-2 rounded-md text-sm font-medium ${currentView === 'qr'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      QRスキャン
                    </button>

                    <button
                      onClick={() => setCurrentView('alerts')}
                      className={`w-full px-4 py-2 rounded-md text-sm font-medium ${currentView === 'alerts'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      通知管理
                    </button>

                    <button
                      onClick={() => setCurrentView('stats')}
                      className={`w-full px-4 py-2 rounded-md text-sm font-medium ${currentView === 'stats'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      📊 Analytics統計
                    </button>

                    <button
                      onClick={() => setCurrentView('analytics')}
                      className={`w-full px-4 py-2 rounded-md text-sm font-medium ${currentView === 'analytics'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      📈 Analytics管理
                    </button>

                    <button
                      onClick={() => setCurrentView('events')}
                      className={`w-full px-4 py-2 rounded-md text-sm font-medium ${currentView === 'events'
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      イベント管理
                    </button>

                    <button
                      onClick={() => setCurrentView('release')}
                      className={`w-full px-4 py-2 rounded-md text-sm font-medium ${currentView === 'release'
                          ? 'bg-gray-800 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      🚀 リリース情報
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
