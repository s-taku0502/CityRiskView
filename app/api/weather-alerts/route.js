import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('=== Weather Alerts API Called ===');
    
    // fast-xml-parserのインポート確認
    let XMLParser;
    try {
      const fastXmlParser = await import('fast-xml-parser');
      XMLParser = fastXmlParser.XMLParser;
      console.log('✅ XMLParser imported successfully');
    } catch (importError) {
      console.error('❌ XMLParser import failed:', importError);
      return NextResponse.json({
        success: false,
        error: 'XMLParser import failed: ' + importError.message,
        alerts: []
      }, { status: 500 });
    }

    // 気象庁XMLフィードエンドポイント
    const JMA_XML_FEED_URL = 'https://www.data.jma.go.jp/developer/xml/feed/extra.xml';
    console.log('🌐 Fetching from:', JMA_XML_FEED_URL);
    
    const response = await fetch(JMA_XML_FEED_URL, {
      headers: {
        'User-Agent': 'CityRiskView/1.0'
      },
      signal: AbortSignal.timeout(15000) // 15秒タイムアウト
    });

    console.log('📡 Fetch response status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlData = await response.text();
    console.log('📄 XML data received, length:', xmlData.length);
    
    // XMLパーサーの設定（修正版）
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      parseNodeValue: true,
      parseAttributeValue: true,
      trimValues: true,
      // textNodeNameを指定して、テキストノードを適切に処理
      textNodeName: "#text",
      // CDATAセクションも適切に処理
      parseTrueNumberOnly: false,
      parseTagValue: false // タグの値を文字列として保持
    });
    
    console.log('🔄 Parsing XML data...');
    const parsedData = parser.parse(xmlData);
    console.log('✅ XML parsed successfully');
    
    if (parsedData.feed) {
      console.log('📊 Feed title:', parsedData.feed.title);
      console.log('📊 Feed updated:', parsedData.feed.updated);
    }

    const alerts = [];

    // フィードエントリを処理
    if (parsedData.feed && parsedData.feed.entry) {
      const entries = Array.isArray(parsedData.feed.entry) ? parsedData.feed.entry : [parsedData.feed.entry];
      console.log(`📝 Processing ${entries.length} entries`);
      
      entries.forEach((entry, index) => {
        try {
          console.log(`\n--- Processing Entry ${index + 1} ---`);
          console.log('Title:', entry.title);
          console.log('Author:', entry.author?.name);
          console.log('Updated:', entry.updated);
          
          // コンテンツの取得を修正
          const content = getEntryContent(entry.content);
          console.log('Content preview:', content ? content.substring(0, 100) + '...' : 'No content');
          
          const alert = processWeatherEntry(entry);
          if (alert) {
            alerts.push(alert);
            console.log('✅ Alert processed successfully');
          } else {
            console.log('❌ Alert processing returned null');
          }
        } catch (entryError) {
          console.error(`❌ Error processing entry ${index}:`, entryError);
        }
      });
    } else {
      console.log('❌ No entries found in feed');
    }

    // 重要度順にソート
    alerts.sort((a, b) => {
      const severityOrder = { 'emergency': 4, 'severe': 3, 'moderate': 2, 'minor': 1, 'info': 0 };
      return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    });

    console.log(`🎯 Final result: ${alerts.length} alerts processed`);
    alerts.forEach((alert, i) => {
      console.log(`Alert ${i + 1}: ${alert.title} [${alert.severity}] - ${alert.area}`);
    });

    return NextResponse.json({
      success: true,
      alerts: alerts,
      lastUpdated: new Date().toISOString(),
      feedUpdated: parsedData.feed?.updated || new Date().toISOString(),
      debug: {
        totalEntries: parsedData.feed?.entry ? (Array.isArray(parsedData.feed.entry) ? parsedData.feed.entry.length : 1) : 0,
        processedAlerts: alerts.length
      }
    });

  } catch (error) {
    console.error('❌ Weather Alerts API Error:', error);
    console.error('❌ Error stack:', error.stack);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      alerts: []
    }, { status: 500 });
  }
}

// コンテンツを適切に取得する関数（新規追加）
function getEntryContent(content) {
  if (!content) return '';
  
  // 文字列の場合はそのまま返す
  if (typeof content === 'string') {
    return content;
  }
  
  // オブジェクトの場合、様々なパターンに対応
  if (typeof content === 'object') {
    // #textプロパティがある場合
    if (content['#text']) {
      return content['#text'];
    }
    
    // CDATAセクションの場合
    if (content['__cdata']) {
      return content['__cdata'];
    }
    
    // @_typeが'text'の場合
    if (content['@_type'] === 'text' && content['#text']) {
      return content['#text'];
    }
    
    // 直接的な値がある場合
    if (content.valueOf && typeof content.valueOf() === 'string') {
      return content.valueOf();
    }
    
    // オブジェクトを文字列化して返す（最後の手段）
    return JSON.stringify(content);
  }
  
  // その他の場合は文字列に変換
  return String(content);
}

// 気象庁XMLエントリを処理する関数（修正版）
function processWeatherEntry(entry) {
  try {
    console.log('🔄 Processing entry:', entry.title);

    if (!entry.title) {
      console.log('❌ Missing title');
      return null;
    }

    const title = entry.title;
    const content = getEntryContent(entry.content); // 修正されたコンテンツ取得関数を使用
    const author = entry.author?.name || '気象庁';
    const updated = entry.updated;
    const id = entry.id;

    // コンテンツが空の場合はスキップしない（タイトルがあれば処理）
    if (!content) {
      console.log('⚠️ No content but processing with title only');
    }

    // タイトルから警報タイプを判定
    const alertType = determineAlertType(title);
    console.log('🏷️ Alert type determined:', alertType);

    const severity = determineSeverity(title, content);
    console.log('⚠️ Severity determined:', severity);

    const region = extractRegion(content, author);
    console.log('📍 Region extracted:', region);

    const coordinates = getRegionCoordinates(region);
    console.log('🗺️ Coordinates:', coordinates);

    const processedAlert = {
      id: id,
      title: title,
      description: content || '詳細情報なし',
      severity: severity,
      area: region,
      eventType: alertType.eventType,
      category: alertType.category,
      publishedAt: updated,
      publishingOffice: author,
      coordinates: coordinates,
      xmlLink: entry.link?.["@_href"] || null
    };

    console.log('✅ Alert successfully created:', {
      title: processedAlert.title,
      severity: processedAlert.severity,
      area: processedAlert.area,
      category: processedAlert.category
    });

    return processedAlert;
  } catch (error) {
    console.error('❌ Error processing weather entry:', error);
    return null;
  }
}

// 警報タイプを判定する関数
function determineAlertType(title) {
  if (title.includes('特別警報')) {
    return { eventType: 'emergency_warning', category: '特別警報' };
  } else if (title.includes('警報')) {
    return { eventType: 'warning', category: '警報' };
  } else if (title.includes('注意報')) {
    return { eventType: 'advisory', category: '注意報' };
  } else if (title.includes('竜巻注意情報')) {
    return { eventType: 'tornado_advisory', category: '竜巻注意情報' };
  } else if (title.includes('台風')) {
    return { eventType: 'typhoon', category: '台風情報' };
  } else if (title.includes('地震')) {
    return { eventType: 'earthquake', category: '地震情報' };
  } else if (title.includes('津波')) {
    return { eventType: 'tsunami', category: '津波情報' };
  } else if (title.includes('気象情報')) {
    return { eventType: 'weather_info', category: '気象情報' };
  } else {
    return { eventType: 'info', category: '一般情報' };
  }
}

// 重要度を判定する関数
function determineSeverity(title, content) {
  // 特別警報は最高レベル
  if (title.includes('特別警報')) {
    return 'emergency';
  }

  // 内容から緊急度を判定
  if (content && (content.includes('厳重に警戒') || content.includes('線状降水帯') || content.includes('災害発生の危険度が急激に高まる'))) {
    return 'emergency';
  }

  // 警報系
  if (title.includes('警報') || (content && content.includes('警戒'))) {
    return 'severe';
  }

  // 注意報系
  if (title.includes('注意報') || (content && content.includes('注意'))) {
    return 'moderate';
  }

  // 竜巻注意情報
  if (title.includes('竜巻注意情報')) {
    return 'severe';
  }

  // 台風情報
  if (title.includes('台風')) {
    return 'moderate';
  }

  return 'info';
}

// 地域名を抽出する関数
function extractRegion(content, author) {
  // 内容から地域名を抽出
  if (content) {
    const regionPatterns = [
      /【(.+?)気象警報・注意報】/,
      /【(.+?)地方気象警報・注意報】/,
      /【(.+?)竜巻注意情報】/,
      /【(.+?)気象情報】/
    ];

    for (const pattern of regionPatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].replace('県', '').replace('都', '').replace('府', '').replace('道', '');
      }
    }
  }

  // 発表機関から地域を推定
  if (author.includes('地方気象台') || author.includes('測候所')) {
    return author.replace('地方気象台', '').replace('測候所', '').replace('管区気象台', '');
  }

  return '全国';
}

// 地域の座標を取得する関数
function getRegionCoordinates(region) {
  const regionCoordinates = {
    // 都道府県の代表座標
    '北海道': [143.2, 43.0],
    '青森': [140.74, 40.82],
    '岩手': [141.15, 39.70],
    '宮城': [140.87, 38.27],
    '秋田': [140.10, 39.72],
    '山形': [140.36, 38.24],
    '福島': [140.47, 37.75],
    '茨城': [140.45, 36.34],
    '栃木': [139.88, 36.57],
    '群馬': [139.06, 36.39],
    '埼玉': [139.65, 35.86],
    '千葉': [140.12, 35.61],
    '東京': [139.69, 35.69],
    '神奈川': [139.64, 35.45],
    '新潟': [139.02, 37.90],
    '富山': [137.21, 36.70],
    '石川': [136.66, 36.59],
    '福井': [136.22, 35.94],
    '山梨': [138.57, 35.66],
    '長野': [138.18, 36.65],
    '岐阜': [136.72, 35.39],
    '静岡': [138.38, 34.98],
    '愛知': [136.91, 35.18],
    '三重': [136.51, 34.73],
    '滋賀': [136.02, 35.00],
    '京都': [135.75, 35.01],
    '大阪': [135.52, 34.69],
    '兵庫': [134.69, 34.69],
    '奈良': [135.83, 34.69],
    '和歌山': [135.17, 34.23],
    '鳥取': [134.24, 35.50],
    '島根': [132.56, 35.47],
    '岡山': [133.93, 34.66],
    '広島': [132.46, 34.40],
    '山口': [131.47, 34.19],
    '徳島': [134.56, 34.07],
    '香川': [134.04, 34.34],
    '愛媛': [132.77, 33.84],
    '高知': [133.53, 33.56],
    '福岡': [130.42, 33.61],
    '佐賀': [130.30, 33.25],
    '長崎': [129.87, 32.76],
    '熊本': [130.74, 32.79],
    '大分': [131.61, 33.24],
    '宮崎': [131.42, 31.91],
    '鹿児島': [130.56, 31.60],
    '沖縄': [127.68, 26.21],
    
    // 特定地域
    '伊豆諸島': [139.39, 34.75],
    '小笠原諸島': [142.19, 27.09],
    '奄美': [129.49, 28.38],
    '宮古島': [125.28, 24.80],
    '八重山': [124.16, 24.34]
  };

  return regionCoordinates[region] || [139.7673068, 35.6809591]; // デフォルトは東京駅
}