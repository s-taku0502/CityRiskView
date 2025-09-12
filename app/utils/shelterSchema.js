export const shelterSchema = [
  { key: 'name', label: '避難所名', type: 'text', required: true, placeholder: '例: ○○小学校体育館' },
  { key: 'prefecture', label: '都道府県', type: 'select', required: true },
  { key: 'city', label: '市区町村', type: 'select', required: true },
  { key: 'address', label: '住所', type: 'text', required: true, placeholder: '例: 東京都○○区○○1-2-3' },
  { key: 'capacity', label: '収容人数', type: 'number', required: true, placeholder: '例: 500' },
  { key: 'latitude', label: '緯度', type: 'number', required: true, placeholder: '例: 35.6762' },
  { key: 'longitude', label: '経度', type: 'number', required: true, placeholder: '例: 139.6503' }
  // 必要に応じて補助項目も追加
];