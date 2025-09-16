import React, { useState } from 'react';
import { parseShelterCsv } from '../utils/parseShelterCsv';

export default function ShelterUpload({ onParsed }) {
  const [csvResult, setCsvResult] = useState([]);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    setError('');
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = parseShelterCsv(text);
      setCsvResult(parsed);
      if (onParsed) onParsed(parsed);
    } catch (err) {
      setError('CSVの読み込みまたは解析に失敗しました');
    }
  };

  return (
    <div>
      <label>
        避難所CSVファイルを選択:
        <input type="file" accept=".csv" onChange={handleFileChange} />
      </label>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {csvResult.length > 0 && (
        <div>
          <h4>プレビュー（先頭5件）</h4>
          <pre style={{ maxHeight: 200, overflow: 'auto', background: '#eee', padding: 8 }}>
            {JSON.stringify(csvResult.slice(0, 5), null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}