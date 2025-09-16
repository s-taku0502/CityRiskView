export function parseShelterCsv(csvText, type) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  // 国土地理院フォーマット判定
  const isEmergency =
    headers.includes('洪水') && headers.includes('崖崩れ、土石流及び地滑り');
  const isShelter =
    headers.includes('指定緊急避難場所との住所同一') && headers.includes('受入対象者');

  return lines.slice(1).map(line => {
    const values = line.split(',');
    let obj = {};

    if (isEmergency) {
      // 指定緊急避難場所
      [
        'NO', '共通ID', '都道府県名及び市町村名', '施設・場所名', '住所',
        '洪水', '崖崩れ、土石流及び地滑り', '高潮', '地震', '津波',
        '大規模な火事', '内水氾濫', '火山現象', '指定避難所との住所同一',
        '緯度', '経度', '備考'
      ].forEach((header, idx) => {
        obj[header] = values[idx]?.trim() ?? '';
      });
      obj['type'] = '指定緊急避難場所';
    } else if (isShelter) {
      // 指定避難所
      [
        'NO', '共通ID', '都道府県名及び市町村名', '施設・場所名', '住所',
        '指定緊急避難場所との住所同一', 'その他市町村長が必要と認める事項',
        '受入対象者', '緯度', '経度', '備考'
      ].forEach((header, idx) => {
        obj[header] = values[idx]?.trim() ?? '';
      });
      obj['type'] = '指定避難所';
    } else {
      // 旧来の汎用パース
      headers.forEach((header, idx) => {
        obj[header] = values[idx]?.trim();
      });
      obj['type'] = type;
    }
    return obj;
  });
}