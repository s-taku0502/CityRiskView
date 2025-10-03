'use client';

import { useEffect, useState } from 'react';

const WeatherAlertList = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [feedUpdated, setFeedUpdated] = useState(null);

  // 気象庁防災情報を取得する関数
  const fetchWeatherAlerts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/weather-alerts');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setAlerts(data.alerts || []);
      setLastUpdated(data.lastUpdated);
      setFeedUpdated(data.feedUpdated);
      
      // XMLリンクのサンプルを1件だけコンソールに表示
      if (data.alerts && data.alerts.length > 0 && data.alerts[0].xmlLink) {
        console.log('XMLリンクサンプル:', data.alerts[0].xmlLink);
      }
      
    } catch (error) {
      console.error('気象庁防災情報の取得に失敗:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 初回読み込みと定期更新
  useEffect(() => {
    fetchWeatherAlerts();
    
    // 3分ごとに更新（XMLフィードはより頻繁に更新される）
    const interval = setInterval(fetchWeatherAlerts, 3 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // 重要度に応じたスタイルを取得
  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'emergency':
        return 'bg-red-100 border-red-500 text-red-800 border-l-8';
      case 'severe':
        return 'bg-orange-100 border-orange-500 text-orange-800 border-l-6';
      case 'moderate':
        return 'bg-yellow-100 border-yellow-500 text-yellow-800 border-l-4';
      case 'minor':
        return 'bg-green-100 border-green-500 text-green-800 border-l-4';
      default:
        return 'bg-blue-100 border-blue-500 text-blue-800 border-l-4';
    }
  };

  // 重要度の日本語表示
  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 'emergency': return '緊急';
      case 'severe': return '警報';
      case 'moderate': return '注意報';
      case 'minor': return '軽微';
      default: return '情報';
    }
  };

  // 時間の相対表示
  const getRelativeTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return '今';
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    return date.toLocaleDateString('ja-JP');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* ヘッダー部分 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">気象庁防災情報</h1>
          <button
            onClick={fetchWeatherAlerts}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '更新中...' : '最新情報を取得'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">総件数: </span>
            <span className="text-blue-600 font-bold">{alerts.length}件</span>
          </div>
          {feedUpdated && (
            <div>
              <span className="font-medium">フィード更新: </span>
              <span>{new Date(feedUpdated).toLocaleString('ja-JP')}</span>
            </div>
          )}
          {lastUpdated && (
            <div>
              <span className="font-medium">取得時刻: </span>
              <span>{new Date(lastUpdated).toLocaleString('ja-JP')}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <div className="flex items-center">
              <span className="font-medium">エラーが発生しました: </span>
              <span>{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* 読み込み中表示 */}
      {loading && alerts.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">防災情報を取得中...</p>
        </div>
      )}

      {/* アラート一覧 */}
      {alerts.length > 0 && (
        <div className="space-y-4">
          {alerts.map((alert, index) => (
            <div
              key={alert.id || index}
              className={`bg-white rounded-lg shadow-md p-6 ${getSeverityStyle(alert.severity)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center flex-1">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{alert.title}</h3>
                    <div className="flex items-center space-x-4 text-sm mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityStyle(alert.severity)}`}>
                        {alert.category}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 text-right ml-4">
                  <div className="font-medium">{getRelativeTime(alert.publishedAt)}</div>
                  <div>{new Date(alert.publishedAt).toLocaleTimeString('ja-JP')}</div>
                </div>
              </div>
              
              <p className="text-gray-700 leading-relaxed mb-4">{alert.description}</p>
              
              <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-3">
                <div className="flex items-center space-x-4">
                  <span>重要度: {getSeverityLabel(alert.severity)}</span>
                  <span>種別: {alert.eventType}</span>
                </div>
                {alert.coordinates && (
                  <span>座標: {alert.coordinates[1].toFixed(2)}, {alert.coordinates[0].toFixed(2)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* データがない場合の表示 */}
      {!loading && alerts.length === 0 && !error && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h3 className="text-lg font-medium text-gray-700 mb-2">現在、発表中の警報・注意報はありません</h3>
          <p className="text-gray-500">最新の気象情報をお確かめください。</p>
        </div>
      )}

      {/* フッター情報 */}
      <div className="mt-8 bg-gray-50 rounded-lg p-4 text-xs text-gray-600">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">データ提供: </span>
            <a href="https://www.data.jma.go.jp/developer/xml/feed/extra.xml" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              気象庁XMLフィード
            </a>
          </div>
          <div>自動更新間隔: 3分</div>
        </div>
      </div>
    </div>
  );
};

export default WeatherAlertList;