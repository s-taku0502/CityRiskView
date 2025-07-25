'use client'

import { useState, useEffect } from 'react'
import AuthGuard from '@/components/AuthGuard'
import Map from '@/app/map/page'
import StockManagement from './components/StockManagement'
import EventCodeManagement from './components/EventCodeManagement'
import GuestManagement from './components/GuestManagement'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
// import { developerEmail } from '@/lib/supabase'

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
      const guestSession = sessionStorage.getItem('guest_session')
      if (guestSession) {
        const guestData = JSON.parse(guestSession)
        setUserInfo({ type: 'guest', data: guestData })
      } else {
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
    }

    fetchShelters()
    checkUserType()
  }, [])

  const handleLogout = async () => {
    // ゲストセッションをチェック
    const guestSession = sessionStorage.getItem('guest_session')

    if (guestSession) {
      // ゲストセッションを削除してゲストログイン画面へ
      sessionStorage.removeItem('guest_session')
      router.push('/guest-login')
    } else {
      // 通常のログアウト
      await supabase.auth.signOut()
      router.push('/login')
    }
  }

  const renderContent = () => {
    const isGuest = userInfo?.type === 'guest'
    
    switch (currentView) {
      case 'stock':
        return <StockManagement selectedShelter={selectedShelter} isGuest={isGuest} />
      case 'qr':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">QRスキャン機能</h3>
            {isGuest ? (
              <div className="text-gray-500">
                <p>ゲストユーザーは閲覧のみ可能です</p>
                <p>QRスキャン機能は管理者のみ利用できます</p>
              </div>
            ) : (
              <p>QRスキャン機能（開発中）</p>
            )}
          </div>
        )
      case 'events':
        // ゲストには表示しない
        return isGuest ? null : <EventCodeManagement />
      case 'guests':
        // ゲストには表示しない
        return isGuest ? null : <GuestManagement />
      case 'alerts':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">通知管理</h3>
            {isGuest ? (
              <div className="text-gray-500">
                <p>ゲストユーザーは閲覧のみ可能です</p>
                <p>通知管理は管理者のみ利用できます</p>
              </div>
            ) : (
              <p>通知管理（開発中）</p>
            )}
          </div>
        )
      case 'stats':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">統計表示</h3>
            {isGuest ? (
              <div className="text-gray-500">
                <p>ゲストユーザーは閲覧のみ可能です</p>
                <p>統計表示機能は管理者のみ利用できます</p>
              </div>
            ) : (
              <p>統計表示（開発中）</p>
            )}
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
                {isGuest && (
                  <span className="text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded">
                    ゲスト: {userInfo.data.name}
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
                    {isGuest ? '閲覧機能' : '管理機能'}
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
                      備蓄管理{isGuest && ' (閲覧)'}
                    </button>

                    {!isGuest && (
                      <button
                        onClick={() => setCurrentView('qr')}
                        className={`w-full px-4 py-2 rounded-md text-sm font-medium ${currentView === 'qr'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        QRスキャン
                      </button>
                    )}

                    {!isGuest && (
                      <button
                        onClick={() => setCurrentView('alerts')}
                        className={`w-full px-4 py-2 rounded-md text-sm font-medium ${currentView === 'alerts'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        通知管理
                      </button>
                    )}

                    {!isGuest && (
                      <button
                        onClick={() => setCurrentView('stats')}
                        className={`w-full px-4 py-2 rounded-md text-sm font-medium ${currentView === 'stats'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        統計表示
                      </button>
                    )}

                    {/* イベント管理とゲスト管理は管理者のみ */}
                    {!isGuest && (
                      <>
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
                          onClick={() => setCurrentView('guests')}
                          className={`w-full px-4 py-2 rounded-md text-sm font-medium ${currentView === 'guests'
                              ? 'bg-teal-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                          ゲスト管理
                        </button>
                      </>
                    )}
                  </div>

                  {/* ゲスト向けの説明 */}
                  {isGuest && (
                    <div className="mt-6 p-3 bg-orange-50 border border-orange-200 rounded-md">
                      <h4 className="text-sm font-medium text-orange-800 mb-2">
                        ゲストモードについて
                      </h4>
                      <ul className="text-xs text-orange-700 space-y-1">
                        <li>• 全ての情報を閲覧できます</li>
                        <li>• データの変更はできません</li>
                        <li>• 備蓄の追加・使用はできません</li>
                        <li>• イベント管理は利用できません</li>
                      </ul>
                    </div>
                  )}
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
