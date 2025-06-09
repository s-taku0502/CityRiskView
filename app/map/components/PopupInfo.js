// ポップアップ詳細表示（地図上の情報）

export default function PopupInfo({ feature }) {
    if (!feature) return null;
  
    const props = feature.properties;
  
    let stockItems = [];
    try {
      stockItems = JSON.parse(props.stock);
    } catch (err) {
      console.warn('備蓄情報のパースに失敗:', err);
    }
  
    return (
      <div className="absolute top-4 right-4 p-4 rounded-xl shadow-lg w-80 z-10">
        <h2 className="font-bold text-lg mb-2">{props.name}</h2>
        <p className="text-sm">住所: {props.address}</p>
        <p className="text-sm">収容人数: {props.capacity}</p>
        <p className="text-sm mb-2">現在の人数: {props.current_people}</p>
  
        <div className="text-sm">
          <strong>備蓄情報:</strong>
          <ul className="list-disc list-inside">
            {stockItems.map((item, index) => (
              <li key={index}>{item.item}: {item.quantity}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
  