"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; // supabaseのインポートを追加

export default function AlertPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdjusting, setIsAdjusting] = useState(false); // 状態を追加

  useEffect(() => {
    // アラートデータを取得する関数
    async function fetchAlerts() {
      try {
        setError(null);
        const res = await fetch("/api/weather-alerts"); // より詳細なAPIに変更
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        
        if (data.success) {
          setAlerts(data.alerts || []);
        } else {
          throw new Error(data.error || 'データの取得に失敗しました');
        }
      } catch (e) {
        console.error("警報データ取得失敗:", e);
        setError(e.message);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    }

    // Supabaseから調整中状態を取得する関数
    const fetchAdjusting = async () => {
      try {
        const { data, error } = await supabase
          .from('ui_adjusting')
          .select('is_adjusting')
          .eq('screen', 'alert')
          .single();
        
        if (!error && data) {
          setIsAdjusting(data.is_adjusting);
        }
      } catch (error) {
        console.error('調整状態の取得に失敗:', error);
      }
    };

    // 初回データ取得
    fetchAlerts();
    fetchAdjusting();

    // 3分ごとにアラートデータを更新
    const interval = setInterval(fetchAlerts, 3 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // 重要度に応じたスタイルを取得
  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'emergency':
        return 'bg-red-50 border-l-4 border-red-500';
      case 'severe':
        return 'bg-orange-50 border-l-4 border-orange-500';
      case 'moderate':
        return 'bg-yellow-50 border-l-4 border-yellow-500';
      case 'minor':
        return 'bg-green-50 border-l-4 border-green-500';
      default:
        return 'bg-blue-50 border-l-4 border-blue-500';
    }
  };

  // 重要度バッジのスタイル
  const getSeverityBadgeStyle = (severity) => {
    switch (severity) {
      case 'emergency':
        return 'bg-red-100 text-red-800';
      case 'severe':
        return 'bg-orange-100 text-orange-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'minor':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // ローディング表示
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">気象情報を読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-6">
        {/* 調整中の警告表示 */}
        {isAdjusting && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-r-lg">
            <div className="flex items-center">
              <span className="font-medium">現在調整中のため、不具合が出る場合があります</span>
            </div>
          </div>
        )}

        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">気象庁 警報・注意報</h1>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
            >
              更新
            </button>
          </div>
          
          <div className="text-sm text-gray-600">
            <span className="font-medium">総件数: </span>
            <span className="text-blue-600 font-bold">{alerts.length}件</span>
            <span className="ml-4 font-medium">最終更新: </span>
            <span>{new Date().toLocaleString('ja-JP')}</span>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r-lg">
            <div className="flex items-center">
              <span className="text-xl mr-2">×</span>
              <div>
                <span className="font-medium">エラーが発生しました: </span>
                <span>{error}</span>
              </div>
            </div>
          </div>
        )}

        {/* アラート一覧 */}
        <div className="space-y-4">
          {alerts.length === 0 && !error && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-6 rounded-r-lg">
              <div className="flex items-center">
                  <a className="font-medium">現在、発表中の警報・注意報はありません</a>
                  <br />
                  <a className="text-sm text-green-600 mt-1">安全な状況が続いています</a>
              </div>
            </div>
          )}
          
          {alerts.map((alert, index) => (
            <div
              key={alert.id || index}
              className={`bg-white rounded-lg shadow-md p-6 ${getSeverityStyle(alert.severity)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-800 mr-3">{alert.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityBadgeStyle(alert.severity)}`}>
                      {alert.category || '情報'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center">
                      {alert.area || '全国'}
                    </span>
                    <span className="flex items-center">
                      {alert.publishingOffice || '気象庁'}
                    </span>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 text-right ml-4">
                  <div className="font-medium">
                    {alert.publishedAt ? new Date(alert.publishedAt).toLocaleString('ja-JP') : '時刻不明'}
                  </div>
                </div>
              </div>
              
              <p className="text-gray-700 leading-relaxed mb-4">
                {alert.description || alert.content || 'No description available'}
              </p>
              
              {alert.xmlLink && (
                <div className="border-t pt-3">
                  <a
                    href={alert.xmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm underline flex items-center"
                  >
                    詳細XML
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* フッター情報 */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-4">
          <div className="text-xs text-gray-600 text-center">
            <div className="flex items-center justify-center space-x-4">
              <span>データ提供: 気象庁</span>
              <span>•</span>
              <span>自動更新: 3分間隔</span>
              <span>•</span>
              <span>最新情報は気象庁公式サイトでご確認ください</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}