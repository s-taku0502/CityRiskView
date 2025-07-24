'use client'

import { useState, useEffect } from 'react'
import AuthGuard from '@/components/AuthGuard'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function DeveloperPage() {
  const [currentView, setCurrentView] = useState('updates')
  const [updates, setUpdates] = useState([])
  const [systemLogs, setSystemLogs] = useState([])
  const [isDeveloper, setIsDeveloper] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkDeveloperAccess()
  }, [])

  const checkDeveloperAccess = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push('/login')
        return
      }

      // 開発者権限チェック
      const developerEmails = ['sudoproject.personal@gmail.com']
      if (!developerEmails.includes(user.email)) {
        alert('開発者権限が必要です')
        router.push('/admin')
        return
      }

      setIsDeveloper(true)
      await fetchData()
    } catch (error) {
      console.error('Developer access check failed:', error)
      router.push('/admin')
    }
    setLoading(false)
  }

  const fetchData = async () => {
    await Promise.all([
      fetchUpdates(),
      fetchSystemLogs()
    ])
  }

  const fetchUpdates = async () => {
    try {
      const { data, error } = await supabase
        .from('developer_updates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUpdates(data || [])
    } catch (error) {
      console.error('Error fetching updates:', error)
    }
  }

  const fetchSystemLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setSystemLogs(data || [])
    } catch (error) {
      console.error('Error fetching logs:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const renderContent = () => {
    switch (currentView) {
      case 'updates':
        return <UpdateManager updates={updates} onRefresh={fetchUpdates} />
      case 'logs':
        return <SystemLogs logs={systemLogs} />
      case 'database':
        return <DatabaseMonitor />
      case 'deployment':
        return <DeploymentManager />
      default:
        return <UpdateManager updates={updates} onRefresh={fetchUpdates} />
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>
  }

  if (!isDeveloper) {
    return null
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-100">
        {/* ヘッダー */}
        <header className="bg-gray-900 text-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold">
                  CityRiskView 開発者画面
                </h1>
                <p className="text-sm text-gray-300">
                  制作者専用 - システム管理・更新履歴
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm bg-purple-600 px-3 py-1 rounded">
                  DEVELOPER
                </span>
                <button
                  onClick={() => router.push('/admin')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  管理画面へ
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  ログアウト
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 左側: 開発者メニュー */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  開発者機能
                </h2>

                <div className="space-y-3">
                  <button
                    onClick={() => setCurrentView('updates')}
                    className={`w-full px-4 py-2 rounded-md text-sm font-medium ${
                      currentView === 'updates'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    更新履歴管理
                  </button>

                  <button
                    onClick={() => setCurrentView('logs')}
                    className={`w-full px-4 py-2 rounded-md text-sm font-medium ${
                      currentView === 'logs'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    システムログ
                  </button>

                  <button
                    onClick={() => setCurrentView('database')}
                    className={`w-full px-4 py-2 rounded-md text-sm font-medium ${
                      currentView === 'database'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    データベース監視
                  </button>

                  <button
                    onClick={() => setCurrentView('deployment')}
                    className={`w-full px-4 py-2 rounded-md text-sm font-medium ${
                      currentView === 'deployment'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    デプロイ管理
                  </button>
                </div>

                <div className="mt-6 p-3 bg-purple-50 border border-purple-200 rounded-md">
                  <h4 className="text-sm font-medium text-purple-800 mb-2">
                    開発者権限について
                  </h4>
                  <ul className="text-xs text-purple-700 space-y-1">
                    <li>• システム全体の監視・管理</li>
                    <li>• 更新履歴の編集・追加</li>
                    <li>• データベース操作</li>
                    <li>• デプロイメント管理</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 右側: メインコンテンツ */}
            <div className="lg:col-span-3">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}

// 更新管理コンポーネント
function UpdateManager({ updates, onRefresh }) {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ title: '', content: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('developer_updates')
        .insert({
          title: formData.title,
          content: formData.content,
          created_at: new Date().toISOString()
        })

      if (error) throw error

      setFormData({ title: '', content: '' })
      setShowForm(false)
      onRefresh()
      alert('更新情報を追加しました')
    } catch (error) {
      console.error('Error adding update:', error)
      alert('更新の追加に失敗しました')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">更新履歴管理</h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm"
          >
            {showForm ? 'キャンセル' : '新規追加'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg bg-gray-50">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  タイトル
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                  placeholder="例: 2025年7月21日"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  内容
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  required
                  rows={4}
                  placeholder="更新内容を記載してください..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? '追加中...' : '追加'}
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {updates.map((update) => (
            <div key={update.id} className="border-l-4 border-purple-500 pl-4 py-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-gray-900">{update.title}</h4>
                  <p className="text-gray-700 mt-1 whitespace-pre-wrap">{update.content}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(update.created_at).toLocaleString('ja-JP')}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {updates.length === 0 && (
            <p className="text-gray-500 text-center py-8">更新履歴がありません</p>
          )}
        </div>
      </div>
    </div>
  )
}

// システムログコンポーネント
function SystemLogs({ logs }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium mb-4">システムログ</h3>
      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
        {logs.map((log) => (
          <div key={log.id} className="mb-1">
            <span className="text-gray-400">[{new Date(log.created_at).toLocaleString()}]</span>
            <span className={`ml-2 ${log.level === 'ERROR' ? 'text-red-400' : log.level === 'WARN' ? 'text-yellow-400' : 'text-green-400'}`}>
              {log.level}:
            </span>
            <span className="ml-2">{log.message}</span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-gray-400">ログがありません</div>
        )}
      </div>
    </div>
  )
}

// データベース監視コンポーネント
function DatabaseMonitor() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // 各テーブルの件数を取得
      const tables = ['shelters', 'bihin_stock', 'guest_accounts', 'event_codes', 'developer_updates', 'system_logs']
      const tableStats = {}

      for (const table of tables) {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (!error) {
          tableStats[table] = count
        }
      }

      setStats(tableStats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
    setLoading(false)
  }

  if (loading) {
    return <div className="bg-white rounded-lg shadow p-6">読み込み中...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium mb-4">データベース監視</h3>
      <div className="grid grid-cols-2 gap-4">
        {stats && Object.entries(stats).map(([table, count]) => (
          <div key={table} className="bg-gray-50 p-4 rounded">
            <div className="font-semibold capitalize">{table.replace('_', ' ')}</div>
            <div className="text-2xl font-bold text-blue-600">{count || 0}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// デプロイ管理コンポーネント
function DeploymentManager() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium mb-4">デプロイ管理</h3>
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 p-4 rounded">
          <h4 className="font-semibold text-green-800">本番環境ステータス</h4>
          <p className="text-green-700">正常稼働中</p>
          <p className="text-sm text-green-600">最終デプロイ: 2025-07-21 10:30 JST</p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 p-4 rounded">
          <h4 className="font-semibold text-blue-800">システム情報</h4>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Next.js 14</li>
            <li>• Supabase Database</li>
            <li>• Vercel Hosting</li>
            <li>• Node.js 18</li>
          </ul>
        </div>
      </div>
    </div>
  )
}