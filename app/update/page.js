'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// 静的な更新情報（バックアップ用）
const staticUpdates = [
    {
        title: "2025年7月21日 (追加更新)",
        content: "管理者画面のイベントコード管理機能を大幅に改善しました。\n• RLS（Row Level Security）権限システムの最適化\n• 管理者専用機能の権限制御を強化\n• コード品質向上とパフォーマンス改善\n• イベントコード無効化・編集機能の安定化"
    },
    {
        title: "2025年7月21日",
        content: "管理者画面のゲスト用ログイン機能を追加しました。\nこれにより、管理者画面の一部画面をゲストユーザーが利用できるようになりました。\n https://cityriskview.vercel.app/guest-login をご覧ください。"
    },
    {
        title: "2025年7月18日",
        content: "一部仕様変更をおこないました。"
    },
    {
        title: "2025年6月7日",
        content: "一般利用者向けのURLを調整しました。\n今後は https://cityriskview.vercel.app/ よりアクセスできます。"
    },
    {
        title: "2025年5月23日",
        content: "地図のメンテナンスを開始しました。\nまた、避難情報画面（サンプル）を作成しました。"
    },
    {
        title: "2025年5月3日",
        content: "地図画面の細微なバグを修正しました。"
    },
    {
        title: "2025年5月2日",
        content: "地図画面を修正しました。"
    },
    {
        title: "2025年5月1日",
        content: "サイトを公開しました。"
    }
];

// ユーティリティ関数：URLと改行を処理して整形されたJSXを返す
function renderContent(content) {
    const lines = content.split('\n');
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return lines.map((line, lineIndex) => {
        const parts = line.split(urlRegex);

        return (
            <p key={lineIndex} className="mb-1">
                {parts.map((part, i) =>
                    urlRegex.test(part) ? (
                        <a
                            key={i}
                            href={part}
                            className="text-blue-600 underline break-all"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {part}
                        </a>
                    ) : (
                        <span key={i}>{part}</span>
                    )
                )}
            </p>
        );
    });
}

export default function UpdatePage() {
    const [updates, setUpdates] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchUpdates()
    }, [])

    const fetchUpdates = async () => {
        try {
            setLoading(true)
            
            // Supabaseから開発者更新履歴を取得
            const { data: developerUpdates, error } = await supabase
                .from('developer_updates')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) {
                console.warn('Developer updates fetch error:', error)
                // エラーの場合は静的データを使用
                setUpdates(staticUpdates)
            } else {
                // データベースのデータを整形
                const dbUpdates = developerUpdates.map(update => ({
                    title: update.title,
                    content: update.content,
                    created_at: update.created_at
                }))

                // 静的データも同じ形式に整形
                const formattedStaticUpdates = staticUpdates.map(update => ({
                    title: update.title,
                    content: update.content,
                    created_at: null // 静的データには作成日時がない
                }))

                // 全ての更新情報を結合
                const allUpdates = [...dbUpdates, ...formattedStaticUpdates]
                
                // 作成日時でソート（データベースのデータが上位に、その後は元の順序を維持）
                allUpdates.sort((a, b) => {
                    if (a.created_at && !b.created_at) return -1
                    if (!a.created_at && b.created_at) return 1
                    if (a.created_at && b.created_at) {
                        return new Date(b.created_at) - new Date(a.created_at)
                    }
                    return 0
                })

                setUpdates(allUpdates)
            }
        } catch (err) {
            console.error('Update fetch error:', err)
            setError(err.message)
            setUpdates(staticUpdates.map(update => ({
                title: update.title,
                content: update.content,
                created_at: null
            })))
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="p-4 flex justify-center items-center min-h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">更新情報を読み込み中...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold pt-4">更新情報</h2>
                {/* 今後のために残しておく */}
                {/* <button
                    onClick={fetchUpdates}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    更新
                </button> */}
            </div>
            
            {error && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-yellow-800 text-sm">
                        最新の更新情報の取得に失敗しました。静的データを表示しています。
                    </p>
                </div>
            )}

            <div className="grid gap-4">
                {updates.map((update, index) => (
                    <div
                        key={index}
                        className="p-4 shadow rounded-lg bg-white"
                    >
                        <h3 className="font-semibold text-lg mb-2">
                            {update.title}
                        </h3>
                        <div className="text-gray-700">
                            {renderContent(update.content)}
                        </div>
                        {/* {update.created_at && (
                            <p className="text-xs text-gray-500 mt-2">
                                {new Date(update.created_at).toLocaleString('ja-JP')}
                            </p>
                        )} */}
                    </div>
                ))}
            </div>
        </div>
    );
}
