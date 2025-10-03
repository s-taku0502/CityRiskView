// 共通のヘルパー関数とスタイリング

// 地方と都道府県のマッピング
export const regionMapping = {
  '北海道': '北海道',
  '青森': '東北', '岩手': '東北', '宮城': '東北', '秋田': '東北', '山形': '東北', '福島': '東北',
  '茨城': '関東', '栃木': '関東', '群馬': '関東', '埼玉': '関東', '千葉': '関東', '東京': '関東', '神奈川': '関東',
  '新潟': '中部', '富山': '中部', '石川': '中部', '福井': '中部', '山梨': '中部', '長野': '中部',
  '岐阜': '中部', '静岡': '中部', '愛知': '中部',
  '三重': '関西', '滋賀': '関西', '京都': '関西', '大阪': '関西', '兵庫': '関西', '奈良': '関西', '和歌山': '関西',
  '鳥取': '中国', '島根': '中国', '岡山': '中国', '広島': '中国', '山口': '中国',
  '徳島': '四国', '香川': '四国', '愛媛': '四国', '高知': '四国',
  '福岡': '九州', '佐賀': '九州', '長崎': '九州', '熊本': '九州', '大分': '九州', '宮崎': '九州', '鹿児島': '九州', '沖縄': '九州'
};

// regionConstants.jsの堅牢なextractPrefecture関数
export const extractPrefecture = (area, publishingOffice) => {
  // 1. areaが明確に指定されている場合
  if (area && area !== '全国' && area !== '') {
    // 都道府県名の正規化
    const normalizedArea = area.replace(/県|府|都|道/g, '');
    for (const prefecture of Object.keys(regionMapping)) {
      if (prefecture.includes(normalizedArea) || normalizedArea.includes(prefecture.replace(/県|府|都|道/g, ''))) {
        return prefecture;
      }
    }
    return area;
  }

  // 2. publishingOfficeから都道府県を抽出
  if (publishingOffice) {
    // 気象庁の発表元パターンに対応した正規表現
    const patterns = [
      // 標準パターン: 「○○地方気象台」「○○気象台」
      /([^地方]+)地方気象台/,
      /([^気象]+)気象台/,
      // 測候所パターン: 「○○測候所」
      /([^測候]+)測候所/,
      // 直接的な都道府県名パターン
      /(北海道|青森|岩手|宮城|秋田|山形|福島|茨城|栃木|群馬|埼玉|千葉|東京|神奈川|新潟|富山|石川|福井|山梨|長野|岐阜|静岡|愛知|三重|滋賀|京都|大阪|兵庫|奈良|和歌山|鳥取|島根|岡山|広島|山口|徳島|香川|愛媛|高知|福岡|佐賀|長崎|熊本|大分|宮崎|鹿児島|沖縄)/,
      // 地域名から都道府県を推定するパターン
      /札幌|函館|旭川|釧路|帯広|北見|稚内/ // 北海道の地域
    ];

    for (const pattern of patterns) {
      const match = publishingOffice.match(pattern);
      if (match) {
        let extracted = match[1];
        
        // 北海道の地域名を北海道に変換
        if (['札幌', '函館', '旭川', '釧路', '帯広', '北見', '稚内'].includes(extracted)) {
          return '北海道';
        }
        
        // 地方名から代表都道府県を推定
        const regionToPrefecture = {
          '東北': '宮城',
          '関東': '東京', 
          '中部': '愛知',
          '近畿': '大阪',
          '関西': '大阪',
          '中国': '広島',
          '四国': '香川',
          '九州': '福岡'
        };
        
        if (regionToPrefecture[extracted]) {
          extracted = regionToPrefecture[extracted];
        }
        
        // 都道府県名の正規化と照合
        for (const prefecture of Object.keys(regionMapping)) {
          const prefBase = prefecture.replace(/県|府|都|道/g, '');
          const extractedBase = extracted.replace(/県|府|都|道/g, '');
          
          if (prefBase === extractedBase || prefecture.includes(extractedBase)) {
            return prefecture;
          }
        }
        
        return extracted;
      }
    }
  }

  return '全国';
};

// 相対時間表示
export const getRelativeTime = (publishedAt) => {
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

// 重要度バッジのスタイル
export const getSeverityBadgeStyle = (severity) => {
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

// カード境界線のスタイル
export const getSeverityCardStyle = (severity) => {
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
export const getSeverityLabel = (severity) => {
  switch (severity) {
    case 'emergency': return '緊急';
    case 'severe': return '重要';
    case 'moderate': return '注意';
    case 'minor': return '情報';
    default: return '情報';
  }
};

// 座標情報取得（必要に応じて実装）
export const getRegionCoordinates = (region) => {
  const coordinates = {
    '北海道': { lat: 43.064, lng: 141.347 },
    '東北': { lat: 38.269, lng: 140.872 },
    '関東': { lat: 35.676, lng: 139.650 },
    '中部': { lat: 35.180, lng: 136.906 },
    '関西': { lat: 34.686, lng: 135.520 },
    '中国': { lat: 34.385, lng: 132.455 },
    '四国': { lat: 33.559, lng: 133.531 },
    '九州': { lat: 33.607, lng: 130.418 }
  };
  
  return coordinates[region] || { lat: 35.676, lng: 139.650 }; // デフォルトは東京
};