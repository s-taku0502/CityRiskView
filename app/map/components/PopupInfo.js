// ポップアップ詳細表示（地図上の情報）

export default function PopupInfo({ feature, onClose }) {
    if (!feature) return null;

    const props = feature.properties;

    let stockItems = [];
    try {
        // stockが文字列ならパース、配列ならそのまま、オブジェクトやその他は空配列
        if (typeof props.stock === 'string') {
            stockItems = JSON.parse(props.stock);
        } else if (Array.isArray(props.stock)) {
            stockItems = props.stock;
        } else {
            stockItems = [];
        }
        if (!Array.isArray(stockItems)) {
            stockItems = [];
        }
    } catch (err) {
        console.warn('備蓄情報のパースに失敗:', err);
        stockItems = [];
    }

    return (
      <div className="absolute top-4 right-4 p-4 rounded-xl shadow-lg w-80 z-10 bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white" aria-label="閉じる">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <h2 className="font-bold text-lg mb-2">{props.name}</h2>
        <p className="text-sm">住所: {props.address}</p>
        <p className="text-sm">収容人数: {props.capacity}</p>
        <p className="text-sm mb-2">現在の人数: {props.current_people}</p>

        <div className="text-sm">
          <strong>備蓄情報:</strong>
          <ul className="list-disc list-inside">
            {Array.isArray(stockItems) && stockItems.length > 0 ? (
              stockItems.map((item) => (
                <li key={item.item}>{item.item}: {item.quantity}</li>
              ))
            ) : (
              <li>備蓄情報なし</li>
            )}
          </ul>
        </div>
      </div>
    );
}
