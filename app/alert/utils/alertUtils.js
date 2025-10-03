// 共通のヘルパー関数とスタイリング

export const extractPrefecture = (area, publishingOffice) => {
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

export const getSeverityLabel = (severity) => {
  switch (severity) {
    case 'emergency': return '緊急';
    case 'severe': return '重要';
    case 'moderate': return '注意';
    case 'minor': return '情報';
    default: return '情報';
  }
};

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