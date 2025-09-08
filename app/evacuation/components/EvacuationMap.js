'use client'

import { useEffect, useRef, useState } from 'react'
import Map from '/app/map/components/Map.js'

export default function EvacuationMap({ currentLocation, nearestShelter, allShelters }) {
  const [selectedShelter, setSelectedShelter] = useState(null)
  const mapRef = useRef(null)

  // 最寄り避難所を選択状態に設定
  useEffect(() => {
    if (nearestShelter) {
      setSelectedShelter(nearestShelter)
    }
  }, [nearestShelter])

  const handleShelterSelect = (shelter) => {
    setSelectedShelter(shelter)
  }

  useEffect(() => {
    // Mapboxの地図を初期化する処理
    // 現在は簡易表示版
  }, [currentLocation, nearestShelter])

  return (
    <div className="space-y-6">
      {/* 最寄り避難所情報 */}
      {nearestShelter && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-bold text-red-800 mb-3">
            最寄りの避難所
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-semibold text-gray-900">{nearestShelter.name}</p>
              <p className="text-sm text-gray-600">{nearestShelter.location}</p>
              <p className="text-sm text-red-600 font-medium">
                距離: 約{nearestShelter.distance?.toFixed(1)}km
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-700">
                定員: {nearestShelter.capacity || 0}人
              </p>
              <p className="text-sm text-gray-700">
                現在の避難者: {nearestShelter.current_people || 0}人
              </p>
              <p className="text-sm text-blue-600">
                徒歩: 約{nearestShelter.walkingTime}分
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 地図コンポーネント */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">避難マップ</h3>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">現在地</span>
            <div className="w-3 h-3 bg-red-500 rounded-full ml-4"></div>
            <span className="text-sm text-gray-600">避難所</span>
            {nearestShelter && (
              <>
                <div className="w-3 h-3 bg-yellow-500 rounded-full ml-4"></div>
                <span className="text-sm text-gray-600">最寄り避難所</span>
              </>
            )}
          </div>
        </div>

        {/* 既存のMapコンポーネントを使用 */}
        <div className="h-96 rounded-lg overflow-hidden">
          <Map 
            center={
              selectedShelter
                ? { latitude: selectedShelter.latitude, longitude: selectedShelter.longitude }
                : undefined
            }
            onShelterSelect={handleShelterSelect}
            highlightedShelter={nearestShelter}
            currentLocation={currentLocation}
            showCurrentLocation={true}
            evacuationMode={true}
          />
        </div>

        {/* 現在地情報 */}
        {currentLocation && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h5 className="font-medium text-blue-800 mb-1">現在地情報</h5>
            <p className="text-sm text-blue-600">
              緯度: {currentLocation.latitude.toFixed(6)}, 
              経度: {currentLocation.longitude.toFixed(6)}
            </p>
          </div>
        )}

        {/* 地図操作ヒント */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <h5 className="font-medium text-yellow-800 mb-1">避難時の注意事項</h5>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• 安全な経路を選択して移動してください</li>
            <li>• 落下物や倒壊の危険がある場所は避けてください</li>
            <li>• 近隣の方と連携して避難してください</li>
            <li>• 避難所での指示に従ってください</li>
          </ul>
        </div>
      </div>

      {/* 選択された避難所の詳細情報 */}
      {selectedShelter && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-medium text-gray-900 mb-4">選択された避難所</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-semibold text-gray-800">{selectedShelter.name}</h5>
              <p className="text-sm text-gray-600 mb-2">{selectedShelter.location}</p>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">距離:</span> {selectedShelter.distance?.toFixed(1)}km</p>
                <p><span className="font-medium">徒歩時間:</span> 約{selectedShelter.walkingTime}分</p>
              </div>
            </div>
            <div>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">定員:</span> {selectedShelter.capacity || 0}人</p>
                <p><span className="font-medium">現在の避難者:</span> {selectedShelter.current_people || 0}人</p>
                <p><span className="font-medium">空き:</span> {(selectedShelter.capacity || 0) - (selectedShelter.current_people || 0)}人</p>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>利用率</span>
                  <span>
                    {selectedShelter.capacity > 0 
                      ? `${Math.round((selectedShelter.current_people || 0) / selectedShelter.capacity * 100)}%`
                      : 'N/A'
                    }
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      (selectedShelter.current_people || 0) / (selectedShelter.capacity || 1) > 0.8
                        ? 'bg-red-500'
                        : (selectedShelter.current_people || 0) / (selectedShelter.capacity || 1) > 0.6
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    }`}
                    style={{ 
                      width: selectedShelter.capacity > 0 
                        ? `${Math.min((selectedShelter.current_people || 0) / selectedShelter.capacity * 100, 100)}%`
                        : '0%'
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 近隣避難所リスト */}
      {allShelters && allShelters.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-medium text-gray-900 mb-4">近隣の避難所（距離順）</h4>
          <div className="space-y-3">
            {allShelters.slice(0, 5).map((shelter, index) => (
              <div
                key={shelter.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  index === 0 
                    ? 'border-red-200 bg-red-50 hover:bg-red-100' 
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                } ${selectedShelter?.id === shelter.id ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => handleShelterSelect(shelter)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">
                      {index === 0 && '★ '}{shelter.name}
                    </p>
                    <p className="text-sm text-gray-600">{shelter.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-blue-600">
                      {shelter.distance?.toFixed(1)}km
                    </p>
                    <p className="text-xs text-gray-500">
                      徒歩{shelter.walkingTime}分
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                  <span>定員: {shelter.capacity || 0}人</span>
                  <span>避難者: {shelter.current_people || 0}人</span>
                  <span className={`font-medium ${
                    (shelter.current_people || 0) / (shelter.capacity || 1) > 0.8
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}>
                    {shelter.capacity > 0 
                      ? `${Math.round((shelter.current_people || 0) / shelter.capacity * 100)}%`
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}