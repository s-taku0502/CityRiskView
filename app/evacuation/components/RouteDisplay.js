'use client'

export default function RouteDisplay({ currentLocation, nearestShelter }) {
  if (!nearestShelter) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">避難経路</h3>
        <p className="text-gray-500">避難経路を計算中...</p>
      </div>
    )
  }

  // 簡易的な避難経路案内を生成
  const generateRouteDirections = (shelter) => {
    return [
      `現在地から${shelter.name}まで約${shelter.distance.toFixed(1)}km`,
      '安全な道路を選択して移動してください',
      '交通状況や道路状況に注意してください',
      '避難所到着後は受付で手続きを行ってください'
    ]
  }

  const directions = generateRouteDirections(nearestShelter)

  return (
    <div className="space-y-6">
      {/* 経路概要 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">避難経路</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">
              {nearestShelter.distance.toFixed(1)}km
            </div>
            <div className="text-sm text-blue-800">距離</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">
              {nearestShelter.walkingTime}分
            </div>
            <div className="text-sm text-green-800">予想時間</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600">徒歩</div>
            <div className="text-sm text-orange-800">移動方法</div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">目的地: {nearestShelter.name}</h4>
          <p className="text-gray-600 text-sm">{nearestShelter.location}</p>
        </div>
      </div>

      {/* 経路詳細 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="font-medium text-gray-900 mb-4">経路案内</h4>
        <div className="space-y-3">
          {directions.map((direction, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                {index + 1}
              </div>
              <p className="text-gray-700">{direction}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 避難所詳細情報 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-bold text-blue-800 mb-3">避難所詳細情報</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-medium text-blue-700 mb-2">基本情報</h5>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• 名称: {nearestShelter.name}</li>
              <li>• 住所: {nearestShelter.address}</li>
              <li>• 定員: {nearestShelter.capacity > 0 ? `${nearestShelter.capacity} 人` : "未設定"}</li>
              <li>• 現在の避難者: {nearestShelter.current_people > 0 ? `${nearestShelter.current_people} 人` : "現在実装中"}</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-blue-700 mb-2">利用状況</h5>
            <div className="text-sm text-blue-600">
              <p>混雑度: {
                nearestShelter.capacity > 0 
                  ? `${Math.round((nearestShelter.current_people || 0) / nearestShelter.capacity * 100)}%`
                  : '最大受け入れ人数が設定されていません'
              }</p>
              <div className="mt-2">
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: nearestShelter.capacity > 0 
                        ? `${Math.min((nearestShelter.current_people || 0) / nearestShelter.capacity * 100, 100)}%`
                        : '0%'
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 避難時の注意事項 */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h4 className="font-bold text-red-800 mb-3">避難時の注意事項</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-medium text-red-700 mb-2">移動時</h5>
            <ul className="text-sm text-red-600 space-y-1">
              <li>• 安全な道路を選択する</li>
              <li>• 落下物に注意する</li>
              <li>• 冠水箇所を避ける</li>
              <li>• 慌てずに移動する</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-red-700 mb-2">持参物</h5>
            <ul className="text-sm text-red-600 space-y-1">
              <li>• 身分証明書</li>
              <li>• 常備薬</li>
              <li>• 携帯電話・充電器</li>
              <li>• 最小限の着替え</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}