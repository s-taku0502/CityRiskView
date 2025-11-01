'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Map from '@/app/map/page'
import { supabase } from '@/lib/supabase'

export default function GuestDashboard() {
  const [selectedShelter, setSelectedShelter] = useState(null)
  const [shelters, setShelters] = useState([])
  const [bihinStock, setBihinStock] = useState([])
  const [currentView, setCurrentView] = useState('map')
  const [guestInfo, setGuestInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // ゲストセッションの確認
    const guestSession = sessionStorage.getItem('guest_session')
    if (!guestSession) {
      router.push('/guest-login')
      return
    }

    const guestData = JSON.parse(guestSession)
    setGuestInfo(guestData)
    
    // データの読み込み
    fetchShelters()
    setLoading(false)
  }, [router])

  const fetchShelters = async () => {
    try {
      const { data: shelters, error } = await supabase
        .from('shelters')
        .select('*')
        .order('name')
      
      if (error) throw error
      setShelters(shelters || [])
    } catch (error) {
      console.error('Error fetching shelters:', error)
    }
  }

  const fetchBihinStock = async (shelterId) => {
    if (!shelterId) return

    try {
      const { data, error } = await supabase
        .from('bihin_stock')
        .select(`
          *,
          bihin_items (
            name,
            category,
            threshold
          )
        `)
        .eq('shelter_id', shelterId)
        .order('id')

      if (error) throw error
      setBihinStock(data || [])
    } catch (error) {
      console.error('Error fetching bihin stock:', error)
      setBihinStock([])
    }
  }

  useEffect(() => {
    if (selectedShelter && currentView === 'stock') {
      fetchBihinStock(selectedShelter.id)
    }
  }, [selectedShelter, currentView])

  const handleLogout = () => {
    sessionStorage.removeItem('guest_session')
    router.push('/guest-login')
  }

  const getStockStatusColor = (quantity, threshold) => {
    if (quantity === 0) return 'bg-red-500'
    if (quantity < threshold) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStockStatusText = (quantity, threshold) => {
    if (quantity === 0) return '在庫切れ'
    if (quantity < threshold) return '在庫少'
    return '在庫あり'
  }

  const renderStockView = () => {
    if (!selectedShelter) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">備蓄確認</h3>
          <p className="text-gray-500">避難所を選択してください</p>
        </div>
      )
    }

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">
            {selectedShelter.name} - 備蓄状況
          </h3>
          <div className="text-sm text-gray-500">
            閲覧専用（ゲストモード）
          </div>
        </div>

        {bihinStock.length === 0 ? (
          <p className="text-gray-500">備蓄データがありません</p>
        ) : (
          <div className="space-y-3">
            {bihinStock.map((stock) => (
              <div
                key={stock.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium">{stock.bihin_items?.name || '不明な備品'}</h4>
                  <p className="text-sm text-gray-500">
                    カテゴリ: {stock.bihin_items?.category || '未分類'}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-lg font-bold">{stock.quantity}</div>
                    <div className="text-xs text-gray-500">
                      閾値: {stock.bihin_items?.threshold || 'N/A'}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${getStockStatusColor(
                        stock.quantity,
                        stock.bihin_items?.threshold || 30
                      )}`}
                    ></div>
                    <span className="text-sm">
                      {getStockStatusText(
                        stock.quantity,
                        stock.bihin_items?.threshold || 30
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderShelterInfo = () => {
    if (!selectedShelter) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">避難所情報</h3>
          <p className="text-gray-500">避難所を選択してください</p>
        </div>
      )
    }

    const capacityPercentage = selectedShelter.capacity > 0 
      ? Math.round((selectedShelter.current_people / selectedShelter.capacity) * 100)
      : 0

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">{selectedShelter.name}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">住所</label>
            <p className="text-gray-900">{selectedShelter.location || '未設定'}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">定員</label>
              <p className="text-xl font-bold text-gray-900">{selectedShelter.capacity || 0} 人</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">現在の避難者数</label>
              <p className="text-xl font-bold text-gray-900">{selectedShelter.current_people || 0} 人</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">収容率</label>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full ${
                  capacityPercentage >= 100 ? 'bg-red-500' :
                  capacityPercentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">{capacityPercentage}%</p>
          </div>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (currentView) {
      case 'stock':
        return renderStockView()
      case 'info':
        return renderShelterInfo()
      case 'status':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium mb-4">統計情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900">総避難所数</h4>
                <p className="text-2xl font-bold text-blue-600">{shelters.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900">総定員</h4>
                <p className="text-2xl font-bold text-green-600">
                  {shelters.reduce((sum, shelter) => sum + (shelter.capacity || 0), 0)}
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-medium text-orange-900">現在の避難者数</h4>
                <p className="text-2xl font-bold text-orange-600">
                  {shelters.reduce((sum, shelter) => sum + (shelter.current_people || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        )
      case 'map':
      default:
        return <Map onShelterSelect={setSelectedShelter} />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">
                  ゲスト画面
                </h1>
                {guestInfo && (
                  <div className="ml-4 flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ゲスト
                    </span>
                    <span className="text-sm text-gray-600">
                      {guestInfo.name} さん
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                閲覧専用モード
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ナビゲーション */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setCurrentView('map')}
              className={`${
                currentView === 'map'
                  ? 'border-indigo-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              地図
            </button>
            <button
              onClick={() => setCurrentView('stock')}
              className={`${
                currentView === 'stock'
                  ? 'border-indigo-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              備蓄確認
            </button>
            <button
              onClick={() => setCurrentView('info')}
              className={`${
                currentView === 'info'
                  ? 'border-indigo-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              避難所情報
            </button>
            <button
              onClick={() => setCurrentView('status')}
              className={`${
                currentView === 'status'
                  ? 'border-indigo-500 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              統計情報
            </button>
          </nav>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}
