'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/weather-alerts');
      const data = await response.json();
      
      if (data.success) {
        setAlerts(data.alerts);
        setLastUpdated(data.lastUpdated);
        setError(null);
      } else {
        setError(data.error || '警報データの取得に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      emergency: 'bg-red-600 text-white',
      severe: 'bg-orange-500 text-white',
      moderate: 'bg-yellow-500 text-black',
      minor: 'bg-blue-500 text-white',
      info: 'bg-gray-500 text-white'
    };
    return colors[severity] || colors.info;
  };

  const getSeverityText = (severity) => {
    const texts = {
      emergency: '緊急',
      severe: '重要',
      moderate: '注意',
      minor: '軽微',
      info: '情報'
    };
    return texts[severity] || '情報';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">警報データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">気象警報・注意報</h1>
            <Link 
              href="/"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              ホームに戻る
            </Link>
          </div>

          {lastUpdated && (
            <p className="text-sm text-gray-600 mb-4">
              最終更新: {new Date(lastUpdated).toLocaleString('ja-JP')}
            </p>
          )}

          <button
            onClick={fetchAlerts}
            className="mb-6 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            disabled={loading}
          >
            更新
          </button>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <p className="font-bold">エラー</p>
              <p>{error}</p>
            </div>
          )}

          {alerts.length === 0 && !error ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">現在、発表中の警報・注意報はありません</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(alert.severity)}`}>
                      {getSeverityText(alert.severity)}
                    </span>
                    <span className="text-xs text-gray-500">{alert.category}</span>
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-2 text-gray-800">
                    {alert.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    対象地域: {alert.area}
                  </p>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    発表機関: {alert.publishingOffice}
                  </p>
                  
                  {alert.description && alert.description !== '詳細情報なし' && (
                    <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                      {alert.description.length > 100 
                        ? alert.description.substring(0, 100) + '...'
                        : alert.description
                      }
                    </p>
                  )}
                  
                  <p className="text-xs text-gray-500">
                    発表: {new Date(alert.publishedAt).toLocaleString('ja-JP')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}