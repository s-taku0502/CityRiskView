'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function EventCodeManagement() {
  const [eventCodes, setEventCodes] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    maxParticipants: ''
  })
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEventCodes()
  }, [])

  const fetchEventCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('event_codes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setEventCodes(data || [])
    } catch (error) {
      console.error('Error fetching event codes:', error)
    }
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const payload = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: formData.description,
        start_date: formData.startDate || null,
        end_date: formData.endDate || null,
        max_participants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        updated_at: new Date().toISOString()
      }

      if (editingId) {
        const { error } = await supabase
          .from('event_codes')
          .update(payload)
          .eq('id', editingId)
      } else {
        const { error } = await supabase
          .from('event_codes')
          .insert(payload)
      }

      if (error) throw error

      fetchEventCodes()
      resetForm()
    } catch (error) {
      console.error('Error saving event code:', error)
      alert('保存に失敗しました: ' + error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      maxParticipants: ''
    })
    setEditingId(null)
    setShowForm(false)
  }

  const editEventCode = (eventCode) => {
    setFormData({
      code: eventCode.code,
      name: eventCode.name,
      description: eventCode.description || '',
      startDate: eventCode.start_date ? eventCode.start_date.split('T')[0] : '',
      endDate: eventCode.end_date ? eventCode.end_date.split('T')[0] : '',
      maxParticipants: eventCode.max_participants || ''
    })
    setEditingId(eventCode.id)
    setShowForm(true)
  }

  const toggleActive = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('event_codes')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      fetchEventCodes()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const deleteEventCode = async (id) => {
    if (!confirm('このイベントコードを削除しますか？')) return

    try {
      const { error } = await supabase
        .from('event_codes')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchEventCodes()
    } catch (error) {
      console.error('Error deleting event code:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-4">読み込み中...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">イベントコード管理</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          {showForm ? 'キャンセル' : '新規作成'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                イベントコード *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                placeholder="EVENT2025"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                イベント名 *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="2025年防災イベント"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                説明
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows="2"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="イベントの説明"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                開始日
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                終了日
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                最大参加者数
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.maxParticipants}
                onChange={(e) => setFormData({...formData, maxParticipants: e.target.value})}
                placeholder="100"
              />
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              {editingId ? '更新' : '作成'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">コード</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">イベント名</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">期間</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">参加者数</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状態</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {eventCodes.map((eventCode) => (
              <tr key={eventCode.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-gray-900">
                  {eventCode.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    <div className="font-medium">{eventCode.name}</div>
                    {eventCode.description && (
                      <div className="text-gray-500 text-xs">{eventCode.description}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {eventCode.start_date && eventCode.end_date ? (
                    <>
                      {new Date(eventCode.start_date).toLocaleDateString('ja-JP')} - 
                      {new Date(eventCode.end_date).toLocaleDateString('ja-JP')}
                    </>
                  ) : (
                    '期間指定なし'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {eventCode.max_participants || '制限なし'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    eventCode.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {eventCode.is_active ? '有効' : '無効'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => editEventCode(eventCode)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => toggleActive(eventCode.id, eventCode.is_active)}
                    className={eventCode.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                  >
                    {eventCode.is_active ? '無効化' : '有効化'}
                  </button>
                  <button
                    onClick={() => deleteEventCode(eventCode.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}