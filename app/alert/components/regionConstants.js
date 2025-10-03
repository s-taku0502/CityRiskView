// 地方区分のマッピング
export const regionMapping = {
  '北海道': '北海道',
  '青森': '東北',
  '岩手': '東北',
  '宮城': '東北',
  '秋田': '東北',
  '山形': '東北',
  '福島': '東北',
  '茨城': '関東',
  '栃木': '関東',
  '群馬': '関東',
  '埼玉': '関東',
  '千葉': '関東',
  '東京': '関東',
  '神奈川': '関東',
  '新潟': '中部',
  '富山': '中部',
  '石川': '中部',
  '福井': '中部',
  '山梨': '中部',
  '長野': '中部',
  '岐阜': '中部',
  '静岡': '中部',
  '愛知': '中部',
  '三重': '近畿',
  '滋賀': '近畿',
  '京都': '近畿',
  '大阪': '近畿',
  '兵庫': '近畿',
  '奈良': '近畿',
  '和歌山': '近畿',
  '鳥取': '中国',
  '島根': '中国',
  '岡山': '中国',
  '広島': '中国',
  '山口': '中国',
  '徳島': '四国',
  '香川': '四国',
  '愛媛': '四国',
  '高知': '四国',
  '福岡': '九州・沖縄',
  '佐賀': '九州・沖縄',
  '長崎': '九州・沖縄',
  '熊本': '九州・沖縄',
  '大分': '九州・沖縄',
  '宮崎': '九州・沖縄',
  '鹿児島': '九州・沖縄',
  '沖縄': '九州・沖縄'
};

// 発表機関と都道府県のマッピング
export const officeMatches = [
  { pattern: /札幌|北海道/, prefecture: '北海道' },
  { pattern: /青森/, prefecture: '青森' },
  { pattern: /岩手/, prefecture: '岩手' },
  { pattern: /仙台|宮城/, prefecture: '宮城' },
  { pattern: /秋田/, prefecture: '秋田' },
  { pattern: /山形/, prefecture: '山形' },
  { pattern: /福島/, prefecture: '福島' },
  { pattern: /水戸|茨城/, prefecture: '茨城' },
  { pattern: /宇都宮|栃木/, prefecture: '栃木' },
  { pattern: /前橋|群馬/, prefecture: '群馬' },
  { pattern: /熊谷|埼玉/, prefecture: '埼玉' },
  { pattern: /銚子|千葉/, prefecture: '千葉' },
  { pattern: /東京/, prefecture: '東京' },
  { pattern: /横浜|神奈川/, prefecture: '神奈川' },
  { pattern: /新潟/, prefecture: '新潟' },
  { pattern: /富山/, prefecture: '富山' },
  { pattern: /金沢|石川/, prefecture: '石川' },
  { pattern: /福井/, prefecture: '福井' },
  { pattern: /甲府|山梨/, prefecture: '山梨' },
  { pattern: /長野/, prefecture: '長野' },
  { pattern: /岐阜/, prefecture: '岐阜' },
  { pattern: /静岡/, prefecture: '静岡' },
  { pattern: /名古屋|愛知/, prefecture: '愛知' },
  { pattern: /津|三重/, prefecture: '三重' },
  { pattern: /大津|滋賀/, prefecture: '滋賀' },
  { pattern: /京都/, prefecture: '京都' },
  { pattern: /大阪/, prefecture: '大阪' },
  { pattern: /神戸|兵庫/, prefecture: '兵庫' },
  { pattern: /奈良/, prefecture: '奈良' },
  { pattern: /和歌山/, prefecture: '和歌山' },
  { pattern: /鳥取/, prefecture: '鳥取' },
  { pattern: /松江|島根/, prefecture: '島根' },
  { pattern: /岡山/, prefecture: '岡山' },
  { pattern: /広島/, prefecture: '広島' },
  { pattern: /下関|山口/, prefecture: '山口' },
  { pattern: /徳島/, prefecture: '徳島' },
  { pattern: /高松|香川/, prefecture: '香川' },
  { pattern: /松山|愛媛/, prefecture: '愛媛' },
  { pattern: /高知/, prefecture: '高知' },
  { pattern: /福岡/, prefecture: '福岡' },
  { pattern: /佐賀/, prefecture: '佐賀' },
  { pattern: /長崎/, prefecture: '長崎' },
  { pattern: /熊本/, prefecture: '熊本' },
  { pattern: /大分/, prefecture: '大分' },
  { pattern: /宮崎/, prefecture: '宮崎' },
  { pattern: /鹿児島/, prefecture: '鹿児島' },
  { pattern: /沖縄|那覇|石垣|宮古/, prefecture: '沖縄' }
];

// 都道府県名を抽出する関数
export const extractPrefecture = (area, publishingOffice) => {
  // 発表機関からマッチング
  for (const { pattern, prefecture } of officeMatches) {
    if (pattern.test(publishingOffice)) {
      return prefecture;
    }
  }

  // 地域名からマッチング
  for (const { pattern, prefecture } of officeMatches) {
    if (pattern.test(area)) {
      return prefecture;
    }
  }

  // 特殊なケースの処理
  if (area.includes('伊豆') || area.includes('小笠原')) return '東京';
  if (area.includes('奄美')) return '鹿児島';
  if (area.includes('宮古') || area.includes('八重山')) return '沖縄';
  
  return '全国';
};

// 重要度に応じたスタイルを取得
export const getSeverityStyle = (severity) => {
  const styles = {
    'emergency': 'border-l-4 border-red-600 bg-red-50',
    'severe': 'border-l-4 border-orange-500 bg-orange-50',
    'moderate': 'border-l-4 border-yellow-500 bg-yellow-50',
    'minor': 'border-l-4 border-blue-500 bg-blue-50',
    'info': 'border-l-4 border-gray-500 bg-gray-50'
  };
  return styles[severity] || styles.info;
};

// 重要度の日本語表示
export const getSeverityLabel = (severity) => {
  switch (severity) {
    case 'emergency': return '緊急';
    case 'severe': return '警報';
    case 'moderate': return '注意報';
    case 'minor': return '軽微';
    default: return '情報';
  }
};

// 時間の相対表示
export const getRelativeTime = (dateString) => {
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