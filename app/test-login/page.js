'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestLoginPage() {
  const [email, setEmail] = useState('admin@cityriskview.local')
  const [password, setPassword] = useState('CityAdmin2025!')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testLogin = async () => {
    setLoading(true)
    setResult('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setResult(`エラー: ${error.message}`)
      } else {
        setResult(`ログイン成功!\nユーザーID: ${data.user.id}\nメール: ${data.user.email}`)
      }
    } catch (err) {
      setResult(`予期しないエラー: ${err.message}`)
    }

    setLoading(false)
  }

  const testLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      setResult(`ログアウトエラー: ${error.message}`)
    } else {
      setResult('ログアウト成功!')
    }
  }

  const checkCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setResult(`現在ログイン中:\nユーザーID: ${user.id}\nメール: ${user.email}`)
    } else {
      setResult('ログインしていません')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center">認証テスト</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={testLogin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
          >
            {loading ? 'テスト中...' : 'ログインテスト'}
          </button>
          
          <button
            onClick={checkCurrentUser}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
          >
            👤 現在のユーザー確認
          </button>
          
          <button
            onClick={testLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
          >
            ログアウト
          </button>
        </div>

        {result && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md">
            <pre className="text-sm whitespace-pre-wrap">{result}</pre>
          </div>
        )}

        <div className="text-center">
          <a href="/admin" className="text-indigo-600 hover:text-indigo-500 text-sm">
            → 管理画面へ
          </a>
        </div>
      </div>
    </div>
  )
}