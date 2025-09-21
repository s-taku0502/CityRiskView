'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNearestShelter } from '@/app/map/hooks/useNearestShelter'
import EvacuationMap from './components/EvacuationMap'
import EvacuationAlert from './components/EvacuationAlert'
import RouteDisplay from './components/RouteDisplay'
import EmergencyContacts from './components/EmergencyContacts'
import { supabase } from '@/lib/supabase'

export default function EvacuationPage() {
  const [currentLocation, setCurrentLocation] = useState(null)
  const [emergencyAlerts, setEmergencyAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState('map')
  const [isAdjusting, setIsAdjusting] = useState(false)

  // 最寄り避難所フックを使用
  const {
    nearestShelter,
    allShelters,
    loading: shelterLoading,
    error: shelterError
  } = useNearestShelter(currentLocation)

  useEffect(() => {
    initializeEvacuation()
    // Supabaseから調整中状態を取得
    const fetchAdjusting = async () => {
      const { data, error } = await supabase
        .from('ui_adjusting')
        .select('is_adjusting')
        .eq('screen', 'evacuation')
        .single()
      if (!error && data) setIsAdjusting(data.is_adjusting)
    }
    fetchAdjusting()
  }, [])

  const initializeEvacuation = async () => {
    try {
      // 現在地取得
      await getCurrentLocation()

      // 緊急警報取得
      await fetchEmergencyAlerts()

      setLoading(false)
    } catch (error) {
      console.error('避難情報の初期化に失敗:', error)
      setLoading(false)
    }
  }

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('位置情報サービスが利用できません'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
          setCurrentLocation(location)
          resolve(location)
        },
        (error) => {
          console.error('位置情報取得エラー:', error)
          // デフォルト位置（東京駅）を設定
          const defaultLocation = { latitude: 35.6809591, longitude: 139.7673068 }
          setCurrentLocation(defaultLocation)
          resolve(defaultLocation)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      )
    })
  }

  const fetchEmergencyAlerts = async () => {
    try {
      // サンプルの緊急警報データ
      const alerts = [
        // {
        //   id: 1,
        //   type: 'earthquake',
        //   level: 'high',
        //   title: '緊急地震速報',
        //   message: '強い揺れに警戒してください。身の安全を確保してください。',
        //   timestamp: new Date().toISOString()
        // }
      ]
      setEmergencyAlerts(alerts)
    } catch (error) {
      console.error('緊急警報の取得に失敗:', error)
    }
  }

  const renderContent = () => {
    switch (currentView) {
      case 'map':
        return (
          <EvacuationMap
            currentLocation={currentLocation}
            nearestShelter={nearestShelter}
            allShelters={allShelters}
          />
        )
      case 'route':
        return (
          <RouteDisplay
            currentLocation={currentLocation}
            nearestShelter={nearestShelter}
          />
        )
      case 'contacts':
        return <EmergencyContacts />
      default:
        return (
          <EvacuationMap
            currentLocation={currentLocation}
            nearestShelter={nearestShelter}
            allShelters={allShelters}
          />
        )
    }
  }

  if (loading || shelterLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">避難情報を読み込み中...</p>
        </div>
      </div>
    )
  }

  if (shelterError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">避難所情報の取得に失敗しました</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            再読み込み
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* 緊急警報 */}
      {emergencyAlerts.length > 0 && (
        <EvacuationAlert alerts={emergencyAlerts} />
      )}

      {/* ヘッダー */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">避難情報</h1>
              {nearestShelter && (
                <div className="ml-4 text-sm text-gray-600">
                  最寄り避難所: {nearestShelter.name}
                  ({nearestShelter.distance?.toFixed(1)}km / 徒歩約{nearestShelter.walkingTime}分)
                </div>
              )}
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
              className={`${currentView === 'map'
                ? 'border-indigo-500 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              避難マップ
            </button>
            <button
              onClick={() => setCurrentView('route')}
              className={`${currentView === 'route'
                ? 'border-indigo-500 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              避難経路
            </button>
            <button
              onClick={() => setCurrentView('contacts')}
              className={`${currentView === 'contacts'
                ? 'border-indigo-500 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              緊急連絡先
            </button>
          </nav>
        </div>
      </div>

      {/* 調整中メッセージ */}
      {isAdjusting && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          現在調整中のため、不具合が出る場合があります
        </div>
      )}

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}