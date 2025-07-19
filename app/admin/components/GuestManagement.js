'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function GuestManagement() {
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGuests()
  }, [])

  const fetchGuests = async () => {
    try {
      const { data, error } = await supabase
        .from('guest_accounts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setGuests(data || [])
    } catch (error) {
      console.error('Error fetching guests:', error)
    }
    setLoading(false)
  }

  const toggleGuestStatus = async (guestId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('guest_accounts')
        .update({ is_active: !currentStatus })
        .eq('id', guestId)

      if (error) throw error
      fetchGuests()
    } catch (error) {
      console.error('Error updating guest status:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">読み込み中...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">ゲストアカウント管理</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">名前</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">イベントコード</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">初回ログイン</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">最終ログイン</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状態</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {guests.map((guest) => (
              <tr key={guest.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {guest.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {guest.event_code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(guest.login_time).toLocaleString('ja-JP')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(guest.last_login_time).toLocaleString('ja-JP')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    guest.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {guest.is_active ? '有効' : '無効'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => toggleGuestStatus(guest.id, guest.is_active)}
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      guest.is_active 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {guest.is_active ? '無効化' : '有効化'}
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