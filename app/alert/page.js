'use client';

import { useEffect, useState } from 'react';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedPrefecture, setSelectedPrefecture] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormatInfo, setShowFormatInfo] = useState(false);

  // 気象庁防災情報を取得
  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/weather-alerts');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setAlerts(data.alerts || []);
        setLastUpdated(data.lastUpdated);
      } else {
        throw new Error(data.error || '気象データの取得に失敗しました');
      }
    } catch (error) {
      setError(error.message);
      console.error('気象データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // 5分ごとに自動更新
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // 重要度に応じたスタイル（従来のもの）
  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'emergency':
        return 'bg-red-600 text-white border-l-4 border-red-800';
      case 'severe':
        return 'bg-orange-500 text-white border-l-4 border-orange-700';
      case 'moderate':
        return 'bg-yellow-500 text-black border-l-4 border-yellow-700';
      case 'minor':
        return 'bg-blue-500 text-white border-l-4 border-blue-700';
      default:
        return 'bg-gray-500 text-white border-l-4 border-gray-700';
    }
  };

  // 重要度バッジのスタイル（丸みのあるバッジ用）
  const getSeverityBadgeStyle = (severity) => {
    switch (severity) {
      case 'emergency':
        return 'bg-red-600 text-white';
      case 'severe':
        return 'bg-orange-500 text-white';
      case 'moderate':
        return 'bg-yellow-500 text-black';
      case 'minor':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // カード全体のスタイル（境界線用）
  const getSeverityCardStyle = (severity) => {
    switch (severity) {
      case 'emergency':
        return 'border-l-4 border-red-600';
      case 'severe':
        return 'border-l-4 border-orange-500';
      case 'moderate':
        return 'border-l-4 border-yellow-500';
      case 'minor':
        return 'border-l-4 border-blue-500';
      default:
        return 'border-l-4 border-gray-500';
    }
  };

  // 重要度ラベル
  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 'emergency': return '緊急';
      case 'severe': return '重要';
      case 'moderate': return '注意';
      case 'minor': return '情報';
      default: return '情報';
    }
  };

  // 都道府県を抽出する簡易関数
  const extractPrefecture = (area, publishingOffice) => {
    if (area && area !== '全国') return area;
    
    const prefectures = [
      '北海道', '青森', '岩手', '宮城', '秋田', '山形', '福島',
      '茨城', '栃木', '群馬', '埼玉', '千葉', '東京', '神奈川',
      '新潟', '富山', '石川', '福井', '山梨', '長野', '岐阜',
      '静岡', '愛知', '三重', '滋賀', '京都', '大阪', '兵庫',
      '奈良', '和歌山', '鳥取', '島根', '岡山', '広島', '山口',
      '徳島', '香川', '愛媛', '高知', '福岡', '佐賀', '長崎',
      '熊本', '大分', '宮崎', '鹿児島', '沖縄'
    ];
    
    for (const pref of prefectures) {
      if (publishingOffice && publishingOffice.includes(pref)) {
        return pref;
      }
    }
    
    return '全国';
  };

  // 改良点2: 相対時間表示を追加
  const getRelativeTime = (publishedAt) => {
    const now = new Date();
    const published = new Date(publishedAt);
    const diffMinutes = Math.floor((now - published) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}分前`;
    } else if (diffMinutes < 1440) {
      return `${Math.floor(diffMinutes / 60)}時間前`;
    } else {
      return `${Math.floor(diffMinutes / 1440)}日前`;
    }
  };

  // 改良版フィルタリング
  const filteredAlerts = alerts.filter(alert => {
    const prefectureMatch = selectedPrefecture === 'all' || 
      extractPrefecture(alert.area, alert.publishingOffice) === selectedPrefecture;
    
    const searchMatch = searchTerm === '' || 
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return prefectureMatch && searchMatch;
  });

  // 利用可能な都道府県リスト
  const availablePrefectures = [...new Set(
    alerts.map(alert => extractPrefecture(alert.area, alert.publishingOffice))
      .filter(pref => pref !== '全国')
  )].sort();

  if (loading && alerts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">気象情報を取得中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* ヘッダー */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-800">気象警報・注意報</h1>
              {/* 情報ボタン */}
              <button
                onClick={() => setShowFormatInfo(!showFormatInfo)}
                className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold hover:bg-blue-600 transition-colors"
                title="フォーマット情報を表示"
              >
                !
              </button>
            </div>
            <button 
              onClick={fetchAlerts}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '更新中...' : '更新'}
            </button>
          </div>

          {/* フォーマット情報の表示 */}
          {showFormatInfo && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-blue-800">気象庁フォーマット情報</h3>
                <button
                  onClick={() => setShowFormatInfo(false)}
                  className="text-blue-600 hover:text-blue-800 font-bold text-xl"
                >
                  ×
                </button>
              </div>
              <div className="space-y-2 text-blue-700">
                <div className="flex items-start gap-2">
                  <span className="font-semibold bg-blue-200 px-2 py-1 rounded text-xs">H27</span>
                  <span className="text-sm">平成27年度（2015年）に策定されたフォーマットを表します</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold bg-blue-200 px-2 py-1 rounded text-xs">H30</span>
                  <span className="text-sm">平成30年度（2018年）に策定されたフォーマットを表します</span>
                </div>
                <p className="text-xs text-blue-600 mt-3">
                  ※ これらのフォーマットは気象庁の防災情報XMLフォーマットの改定版を示しており、
                  情報の構造や内容の表現方法が異なります。
                </p>
              </div>
            </div>
          )}

          {/* 検索とフィルター */}
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            {/* 検索ボックス */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                キーワード検索
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="警報名や内容で検索..."
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* 都道府県フィルター */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                都道府県で絞り込み
              </label>
              <select
                value={selectedPrefecture}
                onChange={(e) => setSelectedPrefecture(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">全国</option>
                {availablePrefectures.map(pref => (
                  <option key={pref} value={pref}>{pref}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 統計情報 */}
          <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600">
            <div>
              <span className="font-medium">総件数: </span>
              <span className="text-blue-600 font-bold">{alerts.length}件</span>
              {(selectedPrefecture !== 'all' || searchTerm !== '') && (
                <span className="ml-2">（表示: {filteredAlerts.length}件）</span>
              )}
            </div>
            {lastUpdated && (
              <div>
                <span className="font-medium">最終更新: </span>
                <span>{new Date(lastUpdated).toLocaleString('ja-JP')}</span>
              </div>
            )}
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <span className="font-medium">エラー: </span>{error}
            </div>
          )}

          {/* アラート一覧 */}
          {filteredAlerts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredAlerts.map((alert, index) => (
                <div key={alert.id || index} className={`rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow ${getSeverityCardStyle(alert.severity)}`}>
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityBadgeStyle(alert.severity)}`}>
                      {getSeverityLabel(alert.severity)}
                    </span>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">{alert.category}</div>
                      <div className="text-xs text-gray-600 font-medium">
                        {getRelativeTime(alert.publishedAt)}
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-2 text-gray-800">{alert.title}</h3>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">対象地域:</span> {extractPrefecture(alert.area, alert.publishingOffice)}
                  </p>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">発表機関:</span> {alert.publishingOffice}
                  </p>
                  
                  <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                    {alert.description}
                  </p>
                  
                  <p className="text-xs text-gray-500 border-t pt-2">
                    発表: {new Date(alert.publishedAt).toLocaleString('ja-JP')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                {selectedPrefecture !== 'all' || searchTerm !== ''
                  ? '条件に一致する警報・注意報はありません'
                  : '現在、発表中の警報・注意報はありません'
                }
              </h3>
              <p className="text-gray-500">
                {searchTerm && '検索条件を変更してお試しください。'}
                {selectedPrefecture !== 'all' && '地域を変更してお試しください。'}
                {!searchTerm && selectedPrefecture === 'all' && '最新の気象情報をお確かめください。'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}