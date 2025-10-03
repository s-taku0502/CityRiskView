'use client';

import { useState, useEffect } from 'react';
import { 
  extractPrefecture, 
  getRelativeTime, 
  getSeverityBadgeStyle, 
  getSeverityCardStyle, 
  getSeverityLabel,
  regionMapping 
} from '../utils/alertUtils';

const WeatherAlertList = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [feedUpdated, setFeedUpdated] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedPrefecture, setSelectedPrefecture] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [groupByRegion, setGroupByRegion] = useState(false);
  const [showFormatInfo, setShowFormatInfo] = useState(false);

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
      
      if (data.success) {
        setAlerts(data.alerts || []);
        setLastUpdated(data.lastUpdated);
        setFeedUpdated(data.feedUpdated);
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
    fetchWeatherAlerts();
    // 3分ごとに自動更新
    const interval = setInterval(fetchWeatherAlerts, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // アラートをフィルタリング（検索機能を追加）
  const filteredAlerts = alerts.filter(alert => {
    const prefecture = extractPrefecture(alert.area, alert.publishingOffice);
    const region = regionMapping[prefecture] || '全国';

    // 地域フィルター
    const regionMatch = selectedRegion === 'all' || region === selectedRegion;
    
    // 都道府県フィルター
    const prefectureMatch = selectedPrefecture === 'all' || prefecture === selectedPrefecture;
    
    // 検索フィルター（新機能）
    const searchMatch = searchTerm === '' || 
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prefecture.includes(searchTerm);

    return regionMatch && prefectureMatch && searchMatch;
  });

  // 地域別にグループ化
  const groupedAlerts = groupByRegion ? 
    filteredAlerts.reduce((groups, alert) => {
      const prefecture = extractPrefecture(alert.area, alert.publishingOffice);
      const region = regionMapping[prefecture] || '全国';
      
      if (!groups[region]) {
        groups[region] = [];
      }
      groups[region].push(alert);
      return groups;
    }, {}) : null;

  // 利用可能な地域と都道府県を取得
  const availableRegions = [...new Set(alerts.map(alert => {
    const prefecture = extractPrefecture(alert.area, alert.publishingOffice);
    return regionMapping[prefecture] || '全国';
  }).filter(region => region !== '全国'))].sort();

  const availablePrefectures = [...new Set(alerts.map(alert => {
    return extractPrefecture(alert.area, alert.publishingOffice);
  }).filter(prefecture => prefecture !== '全国'))].sort();

  // 地方選択時に都道府県をリセット
  const handleRegionChange = (region) => {
    setSelectedRegion(region);
    setSelectedPrefecture('all');
  };

  // 都道府県選択時に地方をリセット
  const handlePrefectureChange = (prefecture) => {
    setSelectedPrefecture(prefecture);
    setSelectedRegion('all');
  };

  // アラートカードコンポーネント
  const AlertCard = ({ alert, index }) => (
    <div 
      key={alert.id || index} 
      className={`rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow ${getSeverityCardStyle(alert.severity)}`}
    >
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
  );

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
              onClick={fetchWeatherAlerts}
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

          {/* フィルターとオプション */}
          <div className="grid gap-4 lg:grid-cols-4 md:grid-cols-2 mb-6">
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

            {/* 地方選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                地方
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => handleRegionChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">全地方</option>
                {availableRegions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            {/* 都道府県選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                都道府県
              </label>
              <select
                value={selectedPrefecture}
                onChange={(e) => handlePrefectureChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">全都道府県</option>
                {availablePrefectures.map(pref => (
                  <option key={pref} value={pref}>{pref}</option>
                ))}
              </select>
            </div>

            {/* 表示オプション */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                表示オプション
              </label>
              <label className="flex items-center p-2 border border-gray-300 rounded-md">
                <input
                  type="checkbox"
                  checked={groupByRegion}
                  onChange={(e) => setGroupByRegion(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">地方別にグループ化</span>
              </label>
            </div>
          </div>

          {/* 統計情報 */}
          <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600">
            <div>
              <span className="font-medium">総件数: </span>
              <span className="text-blue-600 font-bold">{alerts.length}件</span>
              {(selectedRegion !== 'all' || selectedPrefecture !== 'all' || searchTerm !== '') && (
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
            <>
              {groupByRegion ? (
                <div className="space-y-6">
                  {Object.entries(groupedAlerts).map(([region, regionAlerts]) => (
                    <div key={region}>
                      <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                        {region} ({regionAlerts.length}件)
                      </h2>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {regionAlerts.map((alert, index) => (
                          <AlertCard key={alert.id || index} alert={alert} index={index} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredAlerts.map((alert, index) => (
                    <AlertCard key={alert.id || index} alert={alert} index={index} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                条件に一致する警報・注意報はありません
              </h3>
              <p className="text-gray-500">
                検索条件やフィルターを変更してお試しください。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeatherAlertList;