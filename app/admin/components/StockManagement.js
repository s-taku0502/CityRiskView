'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function StockManagement({ selectedShelter }) {
  const [stockData, setStockData] = useState([])
  const [bihinItems, setBihinItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showUseForm, setShowUseForm] = useState(false)

  // 備蓄データ読み込み
  useEffect(() => {
    if (selectedShelter) {
      loadStockData()
      loadBihinItems()
    }
  }, [selectedShelter])

  const loadStockData = async () => {
    try {
      const { data, error } = await supabase
        .from('bihin_stock')
        .select(`
          *,
          bihin_items(name, category, threshold)
        `)
        .eq('shelter_id', selectedShelter.id)

      if (error) throw error
      setStockData(data || [])
    } catch (error) {
      console.error('備蓄データ読み込みエラー:', error)
    }
  }

  const loadBihinItems = async () => {
    try {
      const { data, error } = await supabase
        .from('bihin_items')
        .select('*')

      if (error) throw error
      setBihinItems(data || [])
    } catch (error) {
      console.error('備品マスター読み込みエラー:', error)
    }
  }

  // 在庫警告チェック
  const getStockStatus = (quantity, threshold) => {
    if (quantity === 0) return 'danger'
    if (quantity < threshold) return 'warning'
    return 'safe'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'danger': return 'bg-red-100 text-red-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-green-100 text-green-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'danger': return '在庫切れ'
      case 'warning': return '在庫不足'
      default: return '在庫十分'
    }
  }

  if (!selectedShelter) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">
          避難所を選択してください
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            📦 {selectedShelter.name} - 備蓄管理
          </h2>
          <div className="space-x-2">
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              ➕ 補充登録
            </button>
            <button
              onClick={() => setShowUseForm(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              ➖ 使用登録
            </button>
          </div>
        </div>

        {/* 在庫一覧 */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  備品名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  カテゴリ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  現在数量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  閾値
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状態
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stockData.map((stock) => {
                const status = getStockStatus(stock.quantity, stock.bihin_items.threshold)
                return (
                  <tr key={stock.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {stock.bihin_items.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stock.bihin_items.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stock.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stock.bihin_items.threshold}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                        {getStatusText(status)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 補充フォーム */}
      {showAddForm && (
        <AddStockForm
          selectedShelter={selectedShelter}
          bihinItems={bihinItems}
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            loadStockData()
            setShowAddForm(false)
          }}
        />
      )}

      {/* 使用フォーム */}
      {showUseForm && (
        <UseStockForm
          selectedShelter={selectedShelter}
          stockData={stockData}
          onClose={() => setShowUseForm(false)}
          onSuccess={() => {
            loadStockData()
            setShowUseForm(false)
          }}
        />
      )}
    </div>
  )
}

// 補充フォームコンポーネント
function AddStockForm({ selectedShelter, bihinItems, onClose, onSuccess }) {
  const [selectedItem, setSelectedItem] = useState('')
  const [quantity, setQuantity] = useState('')
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 補充ログに記録
      const { error: logError } = await supabase
        .from('add_bihin')
        .insert({
          shelter_id: selectedShelter.id,
          item_id: selectedItem,
          count: parseInt(quantity),
          user: userName,
          time: new Date().toISOString()
        })

      if (logError) throw logError

      // 在庫更新
      const { data: currentStock } = await supabase
        .from('bihin_stock')
        .select('quantity')
        .eq('shelter_id', selectedShelter.id)
        .eq('item_id', selectedItem)
        .single()

      const newQuantity = (currentStock?.quantity || 0) + parseInt(quantity)

      const { error: updateError } = await supabase
        .from('bihin_stock')
        .upsert({
          shelter_id: selectedShelter.id,
          item_id: selectedItem,
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })

      if (updateError) throw updateError

      alert('補充登録が完了しました')
      onSuccess()
    } catch (error) {
      console.error('補充登録エラー:', error)
      alert('補充登録に失敗しました')
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          備蓄補充登録
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              備品
            </label>
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">選択してください</option>
              {bihinItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              補充数量
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              min="1"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              担当者名
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '登録中...' : '登録'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 使用フォームコンポーネント
function UseStockForm({ selectedShelter, stockData, onClose, onSuccess }) {
  const [selectedStock, setSelectedStock] = useState('')
  const [quantity, setQuantity] = useState('')
  const [userName, setUserName] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const stockItem = stockData.find(s => s.id === selectedStock)
      
      if (stockItem.quantity < parseInt(quantity)) {
        alert('在庫が足りません')
        setLoading(false)
        return
      }

      // 使用ログに記録
      const { error: logError } = await supabase
        .from('use_bihin')
        .insert({
          shelter_id: selectedShelter.id,
          item_id: stockItem.item_id,
          count: parseInt(quantity),
          user: userName,
          reason: reason,
          time: new Date().toISOString()
        })

      if (logError) throw logError

      // 在庫更新
      const newQuantity = stockItem.quantity - parseInt(quantity)

      const { error: updateError } = await supabase
        .from('bihin_stock')
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedStock)

      if (updateError) throw updateError

      alert('使用登録が完了しました')
      onSuccess()
    } catch (error) {
      console.error('使用登録エラー:', error)
      alert('使用登録に失敗しました')
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          備蓄使用登録
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              備品
            </label>
            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">選択してください</option>
              {stockData.map((stock) => (
                <option key={stock.id} value={stock.id}>
                  {stock.bihin_items.name} (在庫: {stock.quantity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              使用数量
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              min="1"
              max={stockData.find(s => s.id === selectedStock)?.quantity || 0}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              使用者名
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              使用理由
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? '登録中...' : '登録'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}