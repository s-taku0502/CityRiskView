'use client';

import { useEffect, useState } from 'react';
import { 
  regionMapping, 
  extractPrefecture, 
  getSeverityStyle, 
  getSeverityLabel, 
  getRelativeTime 
} from './regionConstants';

const WeatherAlertList = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [feedUpdated, setFeedUpdated] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedPrefecture, setSelectedPrefecture] = useState('all');
  const [groupByRegion, setGroupByRegion] = useState(false);

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
      
      if (data.alerts && data.alerts.length > 0 && data.alerts[0].xmlLink) {
        console.log('XMLリンクサンプル:', data.alerts[0].xmlLink);
      }
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherAlerts();
    const interval = setInterval(fetchWeatherAlerts, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // アラートをフィルタリング
  const filteredAlerts = alerts.filter(alert => {
    const prefecture = extractPrefecture(alert.area, alert.publishingOffice);
    const region = regionMapping[prefecture] || '全国';
    
    if (selectedRegion !== 'all' && selectedRegion !== region) {
      return false;
    }
    
    if (selectedPrefecture !== 'all' && selectedPrefecture !== prefecture) {
      return false;
    }
    
    return true;
  });

  // 地域別にグループ化
  const groupedAlerts = groupByRegion ? 
    filteredAlerts.reduce((groups, alert) => {
      const prefecture = extractPrefecture(alert.area, alert.publishingOffice);
      const region = regionMapping[prefecture] || '全国';
      const key = groupByRegion === 'region' ? region : prefecture;
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(alert);
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
              <span className="text-xs text-gray-600">
                {extractPrefecture(alert.area, alert.publishingOffice)}
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
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
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

        {/* フィルターとグループ化オプション */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">地方で絞り込み</label>
            <select
              value={selectedRegion}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">全国</option>
              {availableRegions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">都道府県で絞り込み</label>
            <select
              value={selectedPrefecture}
              onChange={(e) => handlePrefectureChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">全国</option>
              {availablePrefectures.map(prefecture => (
                <option key={prefecture} value={prefecture}>{prefecture}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">表示方法</label>
            <select
              value={groupByRegion}
              onChange={(e) => setGroupByRegion(e.target.value || false)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={false}>一覧表示</option>
              <option value="region">地方別にグループ化</option>
              <option value="prefecture">都道府県別にグループ化</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">総件数: </span>
            <span className="text-blue-600 font-bold">{alerts.length}件</span>
            {(selectedRegion !== 'all' || selectedPrefecture !== 'all') && (
              <span className="ml-2">（表示: {filteredAlerts.length}件）</span>
            )}
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

      {/* アラート表示 */}
      {filteredAlerts.length > 0 && (
        <>
          {groupByRegion ? (
            <div className="space-y-8">
              {Object.entries(groupedAlerts)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([groupName, groupAlerts]) => (
                <div key={groupName} className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                    {groupName} ({groupAlerts.length}件)
                  </h2>
                  <div className="space-y-4">
                    {groupAlerts.map((alert, index) => (
                      <AlertCard key={alert.id || index} alert={alert} index={index} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert, index) => (
                <AlertCard key={alert.id || index} alert={alert} index={index} />
              ))}
            </div>
          )}
        </>
      )}

      {/* データがない場合の表示 */}
      {!loading && filteredAlerts.length === 0 && !error && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            {selectedRegion !== 'all' 
              ? `${selectedRegion}で発表中の警報・注意報はありません`
              : selectedPrefecture !== 'all'
              ? `${selectedPrefecture}で発表中の警報・注意報はありません`
              : '現在、発表中の警報・注意報はありません'
            }
          </h3>
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