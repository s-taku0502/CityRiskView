import { NextResponse } from 'next/server';

export async function GET() {
  try {
    let XMLParser;
    try {
      const fastXmlParser = await import('fast-xml-parser');
      XMLParser = fastXmlParser.XMLParser;
    } catch (importError) {
      return NextResponse.json({
        success: false,
        error: 'XMLParser import failed: ' + importError.message,
        alerts: []
      }, { status: 500 });
    }

    const JMA_XML_FEED_URL = 'https://www.data.jma.go.jp/developer/xml/feed/extra.xml';
    
    const response = await fetch(JMA_XML_FEED_URL, {
      headers: {
        'User-Agent': 'CityRiskView/1.0'
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlData = await response.text();
    
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      parseNodeValue: true,
      parseAttributeValue: true,
      trimValues: true,
      textNodeName: "#text",
      parseTrueNumberOnly: false,
      parseTagValue: false
    });
    
    const parsedData = parser.parse(xmlData);
    const alerts = [];

    if (parsedData.feed && parsedData.feed.entry) {
      const entries = Array.isArray(parsedData.feed.entry) ? parsedData.feed.entry : [parsedData.feed.entry];
      
      entries.forEach((entry) => {
        try {
          const alert = processWeatherEntry(entry);
          if (alert) {
            alerts.push(alert);
          }
        } catch (entryError) {
          // 改善されたエラーハンドリング
          console.error(`Failed to process weather entry: ${entry.id || 'unknown'}`, {
            error: entryError.message,
            stack: entryError.stack,
            entry: {
              id: entry.id,
              title: entry.title,
              category: entry.category?.[0]?.['@_term']
            }
          });
          
          if (process.env.NODE_ENV === 'development') {
            console.warn('Full entry data:', entry);
          }
        }
      });
    }

    // 重要度でソート
    alerts.sort((a, b) => {
      const severityOrder = { 'emergency': 4, 'severe': 3, 'moderate': 2, 'minor': 1, 'info': 0 };
      return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    });

    return NextResponse.json({
      success: true,
      alerts: alerts,
      lastUpdated: new Date().toISOString(),
      feedUpdated: parsedData.feed?.updated || new Date().toISOString(),
      metadata: {
        totalEntries: parsedData.feed?.entry ? (Array.isArray(parsedData.feed.entry) ? parsedData.feed.entry.length : 1) : 0,
        processedEntries: alerts.length,
        errorEntries: (parsedData.feed?.entry ? (Array.isArray(parsedData.feed.entry) ? parsedData.feed.entry.length : 1) : 0) - alerts.length
      }
    });

  } catch (error) {
    console.error('Weather alerts fetch error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

function getEntryContent(content) {
  if (!content) return '';
  
  if (typeof content === 'string') {
    return content;
  }
  
  if (typeof content === 'object') {
    if (content['#text']) {
      return content['#text'];
    }
    
    if (content['__cdata']) {
      return content['__cdata'];
    }
    
    if (content['@_type'] === 'text' && content['#text']) {
      return content['#text'];
    }
    
    if (content.valueOf && typeof content.valueOf() === 'string') {
      return content.valueOf();
    }
    
    return JSON.stringify(content);
  }
  
  return String(content);
}

function processWeatherEntry(entry) {
  try {
    if (!entry.title) {
      return null;
    }

    const title = entry.title;
    const content = getEntryContent(entry.content);
    const author = entry.author?.name || '気象庁';
    const alertType = determineAlertType(title);
    const severity = determineSeverity(title, content);
    const region = extractRegion(content, author);

    return {
      id: entry.id,
      title: title,
      description: content || '詳細情報なし',
      category: entry.category?.[0]?.['@_term'] || 'その他',
      publishedAt: entry.published || entry.updated,
      publishingOffice: entry.author?.name || '気象庁',
      area: region,
      severity: severity,
      alertType: alertType,
      link: entry.link?.['@_href'] || entry.id
    };
  } catch (entryError) {
    // エラーログを記録（本番環境でも重要）
    console.error(`Failed to process weather entry: ${entry.id || 'unknown'}`, {
      error: entryError.message,
      stack: entryError.stack,
      entry: {
        id: entry.id,
        title: entry.title,
        category: entry.category?.[0]?.['@_term']
      }
    });
    
    // デバッグ用の追加情報
    if (process.env.NODE_ENV === 'development') {
      console.warn('Full entry data:', entry);
    }
    
    // エラーが発生したエントリーはnullを返して後でフィルタリング
    return null;
  }
}

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

function determineSeverity(title, content) {
  if (title.includes('特別警報')) {
    return 'emergency';
  }

  if (content && (content.includes('厳重に警戒') || content.includes('線状降水帯') || content.includes('災害発生の危険度が急激に高まる'))) {
    return 'emergency';
  }

  if (title.includes('警報') || (content && content.includes('警戒'))) {
    return 'severe';
  }

  if (title.includes('注意報') || (content && content.includes('注意'))) {
    return 'moderate';
  }

  if (title.includes('竜巻注意情報')) {
    return 'severe';
  }

  if (title.includes('台風')) {
    return 'moderate';
  }

  return 'info';
}

function extractRegion(content, author) {
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

  if (author.includes('地方気象台') || author.includes('測候所')) {
    return author.replace('地方気象台', '').replace('測候所', '').replace('管区気象台', '');
  }

  return '全国';
}

function getRegionCoordinates(region) {
  const regionCoordinates = {
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
    '伊豆諸島': [139.39, 34.75],
    '小笠原諸島': [142.19, 27.09],
    '奄美': [129.49, 28.38],
    '宮古島': [125.28, 24.80],
    '八重山': [124.16, 24.34]
  };

  return regionCoordinates[region] || [139.7673068, 35.6809591];
}