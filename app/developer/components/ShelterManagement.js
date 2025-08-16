"use client";

import { useState, useEffect } from "react";
import { supabase, getWriteClient } from "../../../lib/supabase";
import Papa from 'papaparse';

export default function ShelterManagement() {
  const [shelters, setShelters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [shelterStocks, setShelterStocks] = useState({}); // 追加: 備蓄情報を管理
  const [bihinItems, setBihinItems] = useState([]); // 追加: 備蓄アイテム一覧
  const [formData, setFormData] = useState({
    // 必須項目
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    capacity: "",
    
    // 入力推奨項目
    disaster_flood: false,
    disaster_earthquake: false,
    disaster_tsunami: false,
    disaster_landslide: false,
    disaster_storm_surge: false,
    disaster_fire: false,
    disaster_inland_flood: false,
    disaster_volcano: false,
    current_people: "",
    phone: "",
    
    // 補助表示項目
    wheelchair_accessible: false,
    elevator_available: false,
    slope_available: false,
    braille_block: false,
    first_floor_access: false,
    area: "",
    stock: "",
    email: "",
    url: "",
    notes: ""
  });

  // CSV関連の状態
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [showCsvPreview, setShowCsvPreview] = useState(false);
  const [csvImportLoading, setCsvImportLoading] = useState(false);
  const [selectedRegionFormat, setSelectedRegionFormat] = useState('');
  const [duplicateAction, setDuplicateAction] = useState('overwrite');

  // 地域ごとのプリセットマッピング（既存のまま）
  const regionPresets = {
    tokyo: {
      name: '東京都形式',
      mapping: {
        name: ['施設名'],
        address: ['所在地住所'],
        latitude: ['緯度'],
        longitude: ['経度'],
        disaster_flood: ['洪水'],
        disaster_landslide: ['崖崩れ、土石流及び地滑り'],
        disaster_storm_surge: ['高潮'],
        disaster_earthquake: ['地震'],
        disaster_tsunami: ['津波'],
        disaster_fire: ['大規模な火事'],
        disaster_inland_flood: ['内水氾濫'],
        disaster_volcano: ['火山現象'],
        wheelchair_accessible: ['車椅子使用者対応トイレ'],
        elevator_available: ['エレベーター有'],
        slope_available: ['スロープ等'],
        braille_block: ['点字ブロック'],
        first_floor_access: ['避難スペースが１階']
      }
    },
    toyama: {
      name: '富山市形式',
      mapping: {
        name: ['名 称'],
        address: ['所 在 地'],
        phone: ['電話番号'],
        area: ['面積'],
        capacity: ['収容人員'],
        disaster_flood: ['洪水'],
        disaster_landslide: ['土砂'],
        notes: ['備考']
      }
    },
    kanazawa: {
      name: '金沢市形式',
      mapping: {
        name: ['名称'],
        address: ['所在地_連結表記'],
        latitude: ['緯度'],
        longitude: ['経度'],
        capacity: ['想定収容人数'],
        phone: ['電話番号'],
        email: ['連絡先メールアドレス'],
        url: ['URL'],
        disaster_flood: ['災害種別_洪水'],
        disaster_landslide: ['災害種別_崖崩れ、土石流及び地滑り'],
        disaster_storm_surge: ['災害種別_高潮'],
        disaster_earthquake: ['災害種別_地震'],
        disaster_tsunami: ['災害種別_津波'],
        disaster_fire: ['災害種別_大規模な火事'],
        disaster_inland_flood: ['災害種別_内水氾濫'],
        disaster_volcano: ['災害種別_火山現象'],
        notes: ['備考']
      }
    },
    custom: {
      name: 'カスタム',
      mapping: {}
    }
  };

  // sheltersテーブルのカラム定義（既存のまま）
  const dbColumns = {
    required: [
      { key: 'name', label: '避難所名', type: 'text', placeholder: '例: ○○小学校体育館' },
      { key: 'address', label: '住所', type: 'text', placeholder: '例: 東京都○○区○○1-2-3' },
      { key: 'latitude', label: '緯度', type: 'number', placeholder: '例: 35.6762' },
      { key: 'longitude', label: '経度', type: 'number', placeholder: '例: 139.6503' },
      { key: 'capacity', label: '収容人数', type: 'number', placeholder: '例: 500' }
    ],
    recommended: [
      { key: 'disaster_flood', label: '洪水対応', type: 'checkbox' },
      { key: 'disaster_earthquake', label: '地震対応', type: 'checkbox' },
      { key: 'disaster_tsunami', label: '津波対応', type: 'checkbox' },
      { key: 'disaster_landslide', label: '土砂災害対応', type: 'checkbox' },
      { key: 'disaster_storm_surge', label: '高潮対応', type: 'checkbox' },
      { key: 'disaster_fire', label: '大規模火災対応', type: 'checkbox' },
      { key: 'disaster_inland_flood', label: '内水氾濫対応', type: 'checkbox' },
      { key: 'disaster_volcano', label: '火山現象対応', type: 'checkbox' },
      { key: 'current_people', label: '現在の避難者数', type: 'number', placeholder: '例: 0' },
      { key: 'phone', label: '電話番号', type: 'tel', placeholder: '例: 03-1234-5678' }
    ],
    auxiliary: [
      { key: 'wheelchair_accessible', label: '車椅子対応トイレ', type: 'checkbox' },
      { key: 'elevator_available', label: 'エレベーター有', type: 'checkbox' },
      { key: 'slope_available', label: 'スロープ等', type: 'checkbox' },
      { key: 'braille_block', label: '点字ブロック', type: 'checkbox' },
      { key: 'first_floor_access', label: '避難スペースが1階', type: 'checkbox' },
      { key: 'area', label: '施設面積（㎡）', type: 'number', placeholder: '例: 1000' },
      { key: 'email', label: 'メールアドレス', type: 'email', placeholder: '例: shelter@example.com' },
      { key: 'url', label: 'WebサイトURL', type: 'url', placeholder: '例: https://example.com' },
      { key: 'stock', label: '備蓄情報', type: 'textarea', placeholder: 'JSON形式: {"水": 1000, "毛布": 200}\nまたは\nテキスト形式:\n水: 1000L\n毛布: 200枚' },
      { key: 'notes', label: '備考・その他', type: 'textarea', placeholder: '例: ペット可、Wi-Fi完備など' }
    ]
  };

  // 避難所一覧を取得（既存）
  const fetchShelters = async () => {
    try {
      const { data, error } = await supabase
        .from('shelters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShelters(data || []);
    } catch (error) {
      console.error('避難所データの取得に失敗:', error);
      setMessage("避難所データの取得に失敗しました");
    }
  };

  // 修正: 備蓄アイテム一覧を取得する関数
  const fetchBihinItems = async () => {
    try {
      const { data, error } = await supabase
        .from('bihin_items')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setBihinItems(data || []);
      return data || [];
    } catch (error) {
      console.error('備蓄アイテムの取得に失敗:', error);
      setBihinItems([]);
      return [];
    }
  };

  // 修正: 全避難所の備蓄在庫を取得する関数
  const fetchAllShelterStocks = async () => {
    try {
      const { data, error } = await supabase
        .from('bihin_stock')
        .select(`
          shelter_id,
          quantity,
          bihin_items(name, category, threshold)
        `);

      if (error) throw error;
      
      // shelter_id ごとにグループ化
      const stocksByShelter = {};
      data.forEach(stock => {
        if (!stocksByShelter[stock.shelter_id]) {
          stocksByShelter[stock.shelter_id] = [];
        }
        stocksByShelter[stock.shelter_id].push(stock);
      });
      
      setShelterStocks(stocksByShelter);
      return stocksByShelter;
    } catch (error) {
      console.error('避難所備蓄の取得に失敗:', error);
      setShelterStocks({});
      return {};
    }
  };

  // 修正: 特定避難所の備蓄在庫を取得する関数
  const fetchShelterStock = async (shelterId) => {
    try {
      const { data, error } = await supabase
        .from('bihin_stock')
        .select(`
          *,
          bihin_items(name, category, threshold)
        `)
        .eq('shelter_id', shelterId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('避難所備蓄の取得に失敗:', error);
      return [];
    }
  };

  // 修正: useEffect で初期データを取得
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        fetchShelters(),
        fetchBihinItems(),
        fetchAllShelterStocks()
      ]);
    };
    initializeData();
  }, []);

  // 重複チェック関数（既存のまま）
  const findDuplicateShelter = async (name, address) => {
    try {
      const { data, error } = await supabase
        .from('shelters')
        .select('id, name, address')
        .eq('name', name.trim())
        .eq('address', address.trim())
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('重複チェック中にエラー:', error);
      return null;
    }
  };

  // 避難所を追加または更新（既存のまま）
  const upsertShelter = async (shelterData, checkDuplicate = true) => {
    try {
      const writeClient = getWriteClient();
      let existingShelter = null;
      
      if (checkDuplicate) {
        existingShelter = await findDuplicateShelter(shelterData.name, shelterData.address);
      }

      // テーブルの実際のカラムのみを含むデータを作成
      const dbData = {
        name: shelterData.name,
        address: shelterData.address,
        latitude: shelterData.latitude,
        longitude: shelterData.longitude,
        capacity: shelterData.capacity,
        current_people: shelterData.current_people,
        stock: shelterData.stock // 拡張データはここに格納
      };

      if (existingShelter) {
        // 既存の避難所を更新
        const { error } = await writeClient
          .from('shelters')
          .update(dbData)
          .eq('id', existingShelter.id);

        if (error) throw error;
        
        // ログ記録
        await logAction('INFO', '避難所情報が更新されました', { 
          shelterName: shelterData.name, 
          action: 'shelter_updated',
          shelterId: existingShelter.id
        });
        
        return { action: 'updated', id: existingShelter.id };
      } else {
        // 新しい避難所を追加
        const { data, error } = await writeClient
          .from('shelters')
          .insert([dbData])
          .select()
          .single();

        if (error) throw error;
        
        // ログ記録
        await logAction('INFO', '新しい避難所が追加されました', { 
          shelterName: shelterData.name, 
          action: 'shelter_created',
          shelterId: data.id
        });
        
        return { action: 'inserted', id: data.id };
      }
    } catch (error) {
      console.error('避難所の保存に失敗:', error);
      throw error;
    }
  };

  // システムログの記録（既存のまま）
  const logAction = async (level, message, metadata = {}) => {
    try {
      const writeClient = getWriteClient();
      await writeClient
        .from('system_logs')
        .insert([{
          level,
          message,
          metadata
        }]);
    } catch (error) {
      console.error('ログの記録に失敗:', error);
    }
  };

  // 修正: 備蓄状況の表示テキストを生成
  const getShelterStockStatus = (shelterId) => {
    const stocks = shelterStocks[shelterId] || [];
    if (stocks.length === 0) {
      return '備蓄なし';
    }
    
    const lowStockItems = stocks.filter(stock => 
      stock.quantity < (stock.bihin_items?.threshold || 30)
    );
    
    const totalItems = stocks.length;
    const lowStockCount = lowStockItems.length;
    
    if (lowStockCount > 0) {
      return `${totalItems}品目 (不足: ${lowStockCount}品目)`;
    } else {
      return `${totalItems}品目 (充足)`;
    }
  };

  // 修正: 備蓄状況の色を決定
  const getShelterStockStatusColor = (shelterId) => {
    const stocks = shelterStocks[shelterId] || [];
    if (stocks.length === 0) {
      return 'text-gray-500';
    }
    
    const lowStockItems = stocks.filter(stock => 
      stock.quantity < (stock.bihin_items?.threshold || 30)
    );
    
    if (lowStockItems.length > 0) {
      return 'text-red-600';
    } else {
      return 'text-green-600';
    }
  };

  // フォーム入力の処理（既存のまま）
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // 地域プリセット選択時の処理（既存のまま）
  const handleRegionPresetChange = (regionKey) => {
    setSelectedRegionFormat(regionKey);
    if (regionKey && regionKey !== 'custom' && csvHeaders.length > 0) {
      const preset = regionPresets[regionKey];
      const newMapping = {};
      
      Object.keys(preset.mapping).forEach(dbColumn => {
        const possibleHeaders = preset.mapping[dbColumn];
        const matchedHeader = csvHeaders.find(header => 
          possibleHeaders.some(pattern => 
            header.includes(pattern) || header === pattern
          )
        );
        if (matchedHeader && [...dbColumns.required, ...dbColumns.recommended, ...dbColumns.auxiliary]
            .some(col => col.key === dbColumn)) {
          newMapping[dbColumn] = matchedHeader;
        }
      });
      
      setColumnMapping(newMapping);
    }
  };

  // CSVファイルアップロード処理（既存のまま）
  const handleCsvUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setMessage("CSVファイルを選択してください");
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        if (results.errors.length > 0) {
          setMessage("CSVファイルの解析でエラーが発生しました: " + results.errors[0].message);
          return;
        }

        const headers = results.meta.fields || [];
        const data = results.data;

        setCsvHeaders(headers);
        setCsvData(data);
        
        const detectedFormat = detectRegionFormat(headers);
        if (detectedFormat) {
          setSelectedRegionFormat(detectedFormat);
          handleRegionPresetChange(detectedFormat);
        } else {
          const autoMapping = autoMapColumns(headers);
          setColumnMapping(autoMapping);
        }
        
        setShowCsvPreview(true);
        setMessage(`${data.length}件のデータを読み込みました`);
      },
      error: (error) => {
        setMessage("CSVファイルの読み込みに失敗しました: " + error.message);
      }
    });
  };

  // 地域形式の自動判別（既存のまま）
  const detectRegionFormat = (headers) => {
    const headerStr = headers.join(',');
    
    if (headerStr.includes('施設名') && headerStr.includes('所在地住所') && headerStr.includes('コード')) {
      return 'tokyo';
    }
    
    if (headerStr.includes('区分') && headerStr.includes('名 称') && headerStr.includes('所 在 地')) {
      return 'toyama';
    }
    
    if (headerStr.includes('全国地方公共団体コード') && headerStr.includes('災害種別_洪水')) {
      return 'kanazawa';
    }
    
    return null;
  };

  // カラムの自動マッピング関数（既存のまま）
  const autoMapColumns = (headers) => {
    const mapping = {};
    
    headers.forEach(header => {
      const lowerHeader = header.toLowerCase();
      
      if (lowerHeader.includes('名前') || lowerHeader.includes('name') || 
          lowerHeader.includes('施設名') || lowerHeader.includes('名称') ||
          lowerHeader.includes('名 称')) {
        mapping.name = header;
      } else if (lowerHeader.includes('住所') || lowerHeader.includes('address') || 
                 lowerHeader.includes('所在地') || lowerHeader.includes('所 在 地')) {
        mapping.address = header;
      } else if (lowerHeader.includes('緯度') || lowerHeader.includes('latitude') || 
                 lowerHeader.includes('lat')) {
        mapping.latitude = header;
      } else if (lowerHeader.includes('経度') || lowerHeader.includes('longitude') || 
                 lowerHeader.includes('lng') || lowerHeader.includes('lon')) {
        mapping.longitude = header;
      } else if (lowerHeader.includes('収容') || lowerHeader.includes('capacity') || 
                 lowerHeader.includes('定員') || lowerHeader.includes('人員')) {
        mapping.capacity = header;
      } else if (lowerHeader.includes('現在') || lowerHeader.includes('current') || 
                 lowerHeader.includes('避難者')) {
        mapping.current_people = header;
      }
    });

    return mapping;
  };

  // カラムマッピングの変更（既存のまま）
  const handleMappingChange = (dbColumn, csvColumn) => {
    setColumnMapping(prev => ({
      ...prev,
      [dbColumn]: csvColumn
    }));
  };

  // 災害対応情報を文字列として結合（既存のまま）
  const getDisasterTypes = (data) => {
    const disasters = [];
    if (data.disaster_flood) disasters.push('洪水');
    if (data.disaster_earthquake) disasters.push('地震');
    if (data.disaster_tsunami) disasters.push('津波');
    if (data.disaster_landslide) disasters.push('土砂災害');
    if (data.disaster_storm_surge) disasters.push('高潮');
    if (data.disaster_fire) disasters.push('火災');
    if (data.disaster_inland_flood) disasters.push('内水氾濫');
    if (data.disaster_volcano) disasters.push('火山');
    return disasters.join(', ');
  };

  // バリアフリー情報を文字列として結合（既存のまま）
  const getAccessibilityFeatures = (data) => {
    const features = [];
    if (data.wheelchair_accessible) features.push('車椅子対応');
    if (data.elevator_available) features.push('エレベーター');
    if (data.slope_available) features.push('スロープ');
    if (data.braille_block) features.push('点字ブロック');
    if (data.first_floor_access) features.push('1階アクセス');
    return features.join(', ');
  };

  // 拡張データの作成（既存のまま）
  const createExtendedData = (formData) => {
    // 既存のstockデータを解析
    let existingStock = {};
    if (formData.stock && typeof formData.stock === 'string' && formData.stock.trim()) {
      try {
        existingStock = JSON.parse(formData.stock);
      } catch {
        // JSON形式でない場合はテキストとして保持
        existingStock = { stockText: formData.stock };
      }
    }

    const extendedInfo = {
      ...existingStock, // 既存のstock情報を保持
      disaster_types: getDisasterTypes(formData),
      accessibility: getAccessibilityFeatures(formData),
      phone: formData.phone,
      email: formData.email,
      url: formData.url,
      area: formData.area ? parseInt(formData.area) : null,
      notes: formData.notes,
      disaster_details: {
        flood: formData.disaster_flood,
        earthquake: formData.disaster_earthquake,
        tsunami: formData.disaster_tsunami,
        landslide: formData.disaster_landslide,
        storm_surge: formData.disaster_storm_surge,
        fire: formData.disaster_fire,
        inland_flood: formData.disaster_inland_flood,
        volcano: formData.disaster_volcano
      },
      accessibility_details: {
        wheelchair_accessible: formData.wheelchair_accessible,
        elevator_available: formData.elevator_available,
        slope_available: formData.slope_available,
        braille_block: formData.braille_block,
        first_floor_access: formData.first_floor_access
      }
    };

    return extendedInfo;
  };

  // CSVインポート前のバリデーション
  const validateCsvMapping = () => {
    const unmappedRequired = [];
    
    dbColumns.required.forEach(column => {
      const mapping = columnMapping[column.key];
      if (!mapping || mapping === '') {
        unmappedRequired.push(column.label);
      }
      // 「該当なし」(__none__)は設定済みとして扱う
    });
    
    if (unmappedRequired.length > 0) {
      let errorMessage = 'インポートを実行できません:\n\n';
      
      errorMessage += `未選択の必須項目:\n${unmappedRequired.map(label => `・${label}`).join('\n')}\n\n`;
      errorMessage += '必須項目はCSVの適切なカラムにマッピングするか「該当なし」を選択してください。';
      
      return errorMessage;
    }
    
    return null;
  };

  // CSVデータの一括インポート（既存のまま、ログ追加）
  const handleCsvImport = async () => {
    // 事前バリデーション
    const validationError = validateCsvMapping();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setCsvImportLoading(true);
    setMessage("");

    try {
      let importedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      const errors = [];

      // ログ記録
      await logAction('INFO', 'CSVインポートを開始しました', { 
        action: 'csv_import_start',
        totalRows: csvData.length,
        duplicateAction
      });

      for (let index = 0; index < csvData.length; index++) {
        const row = csvData[index];
        const rowData = {
          name: '',
          address: '',
          latitude: null,
          longitude: null,
          capacity: null,
          current_people: 0
        };
        let hasRequiredFields = true;

        // 必須項目の処理
        for (const column of dbColumns.required) {
          const csvColumn = columnMapping[column.key];
          
          // 「該当なし」が選択されている場合の処理
          if (csvColumn === '__none__') {
            // デフォルト値を設定
            if (column.key === 'name') {
              rowData[column.key] = `未設定避難所_${index + 1}`;
            } else if (column.key === 'address') {
              rowData[column.key] = '住所未設定';
            } else if (column.key === 'latitude') {
              rowData[column.key] = 0.0;
            } else if (column.key === 'longitude') {
              rowData[column.key] = 0.0;
            } else if (column.key === 'capacity') {
              rowData[column.key] = 0;
            } else {
              rowData[column.key] = column.key === 'current_people' ? 0 : null;
            }
            continue;
          }
          
          let value = csvColumn ? row[csvColumn] : null;

          if (!value || value.toString().trim() === '') {
            hasRequiredFields = false;
            errors.push(`行${index + 1}: ${column.label}が必須です（値が空です）`);
            continue;
          } else {
            if (column.type === 'number') {
              const cleanValue = value.toString().replace(/[^\d.-]/g, '');
              const numValue = parseFloat(cleanValue);
              if (isNaN(numValue)) {
                hasRequiredFields = false;
                errors.push(`行${index + 1}: ${column.label}は数値である必要があります (${value})`);
                continue;
              }
              value = numValue;
            }
          }

          rowData[column.key] = value || (column.key === 'current_people' ? 0 : null);
        }

        if (!hasRequiredFields) continue;

        // その他の項目を処理
        const allColumns = [...dbColumns.recommended, ...dbColumns.auxiliary];
        for (const column of allColumns) {
          const csvColumn = columnMapping[column.key];
          let value = csvColumn && csvColumn !== '__none__' ? row[csvColumn] : null;

          if (value) {
            if (column.type === 'checkbox') {
              value = value === '1' || value === 'true' || value === '○' || value === 'yes';
            } else if (column.type === 'number') {
              const cleanValue = value.toString().replace(/[^\d.-]/g, '');
              const numValue = parseFloat(cleanValue);
              value = isNaN(numValue) ? null : numValue;
            }
          }

          if (column.key.startsWith('disaster_') || column.key.endsWith('_accessible') || 
              column.key.endsWith('_available') || column.key === 'braille_block' || 
              column.key === 'first_floor_access') {
            rowData[column.key] = !!value;
          } else {
            rowData[column.key] = value;
          }
        }

        // 拡張データの作成
        const stockData = createExtendedData(rowData);
        
        const shelterData = {
          name: rowData.name,
          address: rowData.address,
          latitude: rowData.latitude,
          longitude: rowData.longitude,
          capacity: rowData.capacity,
          current_people: rowData.current_people,
          stock: stockData
        };

        try {
          if (duplicateAction === 'skip') {
            const existing = await findDuplicateShelter(shelterData.name, shelterData.address);
            if (existing) {
              skippedCount++;
              continue;
            }
          }

          const result = await upsertShelter(shelterData, duplicateAction === 'overwrite');
          
          if (result.action === 'updated') {
            updatedCount++;
          } else {
            importedCount++;
          }
        } catch (error) {
          errors.push(`行${index + 1}: 保存に失敗しました - ${error.message}`);
        }
      }

      let resultMessage = [];
      if (importedCount > 0) resultMessage.push(`${importedCount}件の新規避難所を追加`);
      if (updatedCount > 0) resultMessage.push(`${updatedCount}件の既存避難所を更新`);
      if (skippedCount > 0) resultMessage.push(`${skippedCount}件をスキップ`);
      
      if (errors.length > 0) {
        resultMessage.push(`\nエラー: ${errors.slice(0, 5).join('\n')}`);
        if (errors.length > 5) resultMessage.push(`\n...他${errors.length - 5}件のエラー`);
      }

      // 完了ログ記録
      await logAction('INFO', 'CSVインポートが完了しました', { 
        action: 'csv_import_complete',
        importedCount,
        updatedCount,
        skippedCount,
        errorCount: errors.length
      });

      setMessage(resultMessage.join('、') + 'しました');
      setShowCsvPreview(false);
      setCsvData([]);
      setCsvHeaders([]);
      setColumnMapping({});
      setSelectedRegionFormat('');
      
      // データ再取得
      await Promise.all([
        fetchShelters(),
        fetchAllShelterStocks()
      ]);

    } catch (error) {
      console.error('CSVインポートに失敗:', error);
      setMessage("CSVインポートに失敗しました: " + error.message);
      
      await logAction('ERROR', 'CSVインポートでエラーが発生しました', { 
        action: 'csv_import_error',
        error: error.message
      });
    } finally {
      setCsvImportLoading(false);
    }
  };

  // フォーム送信処理（既存のまま）
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      // 必須項目のバリデーション
      const requiredFields = dbColumns.required;
      for (const field of requiredFields) {
        if (!formData[field.key] || formData[field.key].toString().trim() === '') {
          setMessage(`${field.label}は必須項目です`);
          setIsLoading(false);
          return;
        }
      }

      // 拡張データの作成
      const stockData = createExtendedData(formData);
      
      const shelterData = {
        name: formData.name,
        address: formData.address,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        capacity: parseInt(formData.capacity) || null,
        current_people: parseInt(formData.current_people) || 0,
        stock: stockData
      };

      const result = await upsertShelter(shelterData, true);
      
      if (result.action === 'updated') {
        setMessage("既存の避難所情報を更新しました");
      } else {
        setMessage("新しい避難所を追加しました");
      }
      
      // フォームリセット
      setFormData({
        name: "", address: "", latitude: "", longitude: "", capacity: "",
        disaster_flood: false, disaster_earthquake: false, disaster_tsunami: false,
        disaster_landslide: false, disaster_storm_surge: false, disaster_fire: false,
        disaster_inland_flood: false, disaster_volcano: false, current_people: "", phone: "",
        wheelchair_accessible: false, elevator_available: false, slope_available: false,
        braille_block: false, first_floor_access: false, area: "", stock: "",
        email: "", url: "", notes: ""
      });
      
      // データ再取得
      await Promise.all([
        fetchShelters(),
        fetchAllShelterStocks()
      ]);
    } catch (error) {
      console.error('避難所の保存に失敗:', error);
      setMessage("避難所の保存に失敗しました: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 避難所を削除（既存のまま、ログ追加）
  const handleDelete = async (id) => {
    if (!confirm("この避難所を削除しますか？")) return;

    try {
      const writeClient = getWriteClient();
      const shelter = shelters.find(s => s.id === id);
      
      const { error } = await writeClient
        .from('shelters')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // ログ記録
      await logAction('INFO', '避難所が削除されました', { 
        shelterName: shelter?.name || 'Unknown',
        action: 'shelter_deleted',
        shelterId: id
      });

      setMessage("避難所が削除されました");
      
      // データ再取得
      await Promise.all([
        fetchShelters(),
        fetchAllShelterStocks()
      ]);
    } catch (error) {
      console.error('避難所の削除に失敗:', error);
      setMessage("避難所の削除に失敗しました: " + error.message);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">避難所管理</h2>

      {/* メッセージ表示 */}
      {message && (
        <div className={`mb-4 p-3 rounded whitespace-pre-line ${
          message.includes("失敗") || message.includes("エラー") 
            ? "bg-red-100 text-red-700" 
            : "bg-green-100 text-green-700"
        }`}>
          {message}
        </div>
      )}

      {/* CSVアップロードセクション（既存のまま） */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-lg font-semibold mb-4">CSVファイルから一括インポート</h3>
        
        {/* 重複時の動作設定 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">重複した避難所の処理方法</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="duplicateAction"
                value="overwrite"
                checked={duplicateAction === 'overwrite'}
                onChange={(e) => setDuplicateAction(e.target.value)}
                className="mr-2"
              />
              <span className="text-sm">上書きする（推奨）</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="duplicateAction"
                value="skip"
                checked={duplicateAction === 'skip'}
                onChange={(e) => setDuplicateAction(e.target.value)}
                className="mr-2"
              />
              <span className="text-sm">スキップする</span>
            </label>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            重複は「避難所名」と「住所」の組み合わせで判定されます
          </div>
        </div>
        
        {/* 地域プリセット選択 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">地域形式を選択（自動判別も行います）</label>
          <select
            value={selectedRegionFormat}
            onChange={(e) => handleRegionPresetChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="">自動判別</option>
            {Object.entries(regionPresets).map(([key, preset]) => (
              <option key={key} value={key}>{preset.name}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">CSVファイルを選択</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleCsvUpload}
            className="w-full p-2 border border-gray-300 rounded"
          />
          <div className="mt-2 text-sm text-gray-500">
            対応形式: 東京都、富山市、金沢市、その他のカスタム形式
            <br />
            基本項目: 名称、住所、緯度、経度、収容人数
          </div>
        </div>

        {/* CSVプレビューとマッピング（既存のまま） */}
        {showCsvPreview && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-semibold">カラムマッピングの確認</h4>
              {selectedRegionFormat && selectedRegionFormat !== 'custom' && (
                <div className="text-sm text-blue-600">
                  {regionPresets[selectedRegionFormat].name}を適用中
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {[...dbColumns.required, ...dbColumns.recommended, ...dbColumns.auxiliary]
                .map(column => {
                  const isRequired = dbColumns.required.includes(column);
                  const currentMapping = columnMapping[column.key] || '';
                  const isEmpty = currentMapping === '';
                  const hasError = isRequired && isEmpty; // 「該当なし」はエラーとしない
                  
                  return (
                    <div key={column.key} className={`flex items-center gap-2 ${hasError ? 'bg-red-50 p-2 rounded' : ''}`}>
                      <label className="w-32 text-sm font-medium">
                        {column.label}
                        {isRequired && <span className="text-red-500">*</span>}:
                      </label>
                      <select
                        value={currentMapping}
                        onChange={(e) => handleMappingChange(column.key, e.target.value)}
                        className={`flex-1 p-1 border rounded text-sm ${
                          hasError 
                            ? 'border-red-500 bg-red-50' 
                            : 'border-gray-300'
                        }`}
                      >
                        <option value="">選択してください</option>
                        <option value="__none__" className="text-gray-500">該当なし</option>
                        {csvHeaders.map(header => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </select>
                      {hasError && (
                        <span className="text-red-500 text-xs">必須</span>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* マッピング状況の概要表示 */}
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <h5 className="text-sm font-medium mb-2">マッピング状況</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-green-600">
                    ✓ 設定済み: {dbColumns.required.filter(col => 
                      columnMapping[col.key] && columnMapping[col.key] !== ''
                    ).length}件
                  </span>
                </div>
                <div>
                  <span className="font-medium text-red-600">
                    ✗ 未設定: {dbColumns.required.filter(col => 
                      !columnMapping[col.key] || columnMapping[col.key] === ''
                    ).length}件
                  </span>
                </div>
                <div>
                  <span className="font-medium text-blue-600">
                    − 内「該当なし」: {dbColumns.required.filter(col => 
                      columnMapping[col.key] === '__none__'
                    ).length}件
                  </span>
                </div>
              </div>
              {(dbColumns.required.filter(col => 
                !columnMapping[col.key] || columnMapping[col.key] === ''
              ).length > 0) && (
                <div className="mt-2 text-xs text-red-600">
                  ⚠️ 未設定の必須項目があります
                </div>
              )}
            </div>

            {/* データプレビュー */}
            <h4 className="text-md font-semibold mb-2">データプレビュー（最初の5件）</h4>
            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    {dbColumns.required.map(column => (
                      <th key={column.key} className="border border-gray-300 p-2 text-left">
                        {column.label}
                        <span className="text-red-500">*</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(0, 5).map((row, index) => (
                    <tr key={index}>
                      {dbColumns.required.map(column => {
                        const csvColumn = columnMapping[column.key];
                        const value = csvColumn && csvColumn !== '__none__' ? row[csvColumn] : '';
                        const isEmpty = !value || value === '';
                        const isNotMapped = csvColumn === '__none__';
                        return (
                          <td key={column.key} className={`border border-gray-300 p-2 ${
                            isEmpty ? 'bg-red-50 text-red-700' : ''
                          } ${isNotMapped ? 'bg-gray-50 text-gray-500' : ''}`}>
                            {isNotMapped ? '該当なし' : (value || '-')}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleCsvImport}
                disabled={csvImportLoading}
                className={`px-6 py-2 rounded text-white ${
                  csvImportLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {csvImportLoading ? "インポート中..." : "データをインポート"}
              </button>
              <button
                onClick={() => {
                  setShowCsvPreview(false);
                  setCsvData([]);
                  setCsvHeaders([]);
                  setColumnMapping({});
                  setSelectedRegionFormat('');
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 個別入力フォーム（既存のまま） */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-lg font-semibold mb-6">避難所を個別に追加・更新</h3>
        <div className="text-sm text-gray-600 mb-4">
          同じ名前と住所の避難所が既に存在する場合は、情報が更新されます。
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 必須項目セクション */}
          <div className="border-l-4 border-red-500 pl-4">
            <h4 className="text-md font-semibold text-red-700 mb-4">必須項目</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dbColumns.required.map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium mb-1">
                    {field.label} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={field.type}
                    name={field.key}
                    value={formData[field.key]}
                    onChange={handleInputChange}
                    required
                    step={field.type === 'number' ? 'any' : undefined}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 入力推奨項目セクション */}
          <div className="border-l-4 border-yellow-500 pl-4">
            <h4 className="text-md font-semibold text-yellow-700 mb-4">入力推奨項目</h4>
            
            {/* 災害対応 */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">災害対応可能種別</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {dbColumns.recommended.filter(field => field.key.startsWith('disaster_')).map(field => (
                  <label key={field.key} className="flex items-center">
                    <input
                      type="checkbox"
                      name={field.key}
                      checked={formData[field.key]}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="text-sm">{field.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* その他推奨項目 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dbColumns.recommended.filter(field => !field.key.startsWith('disaster_')).map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    name={field.key}
                    value={formData[field.key]}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 補助表示項目セクション */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="text-md font-semibold text-blue-700 mb-4">補助表示項目</h4>
            
            {/* バリアフリー対応 */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">バリアフリー対応</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {dbColumns.auxiliary.filter(field => field.type === 'checkbox').map(field => (
                  <label key={field.key} className="flex items-center">
                    <input
                      type="checkbox"
                      name={field.key}
                      checked={formData[field.key]}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="text-sm">{field.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* その他補助項目 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dbColumns.auxiliary.filter(field => field.type !== 'checkbox' && field.type !== 'textarea').map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    name={field.key}
                    value={formData[field.key]}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
            </div>

            {/* テキストエリア項目 */}
            <div className="grid grid-cols-1 gap-4 mt-4">
              {dbColumns.auxiliary.filter(field => field.type === 'textarea').map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium mb-1">{field.label}</label>
                  <textarea
                    name={field.key}
                    value={formData[field.key]}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 送信ボタン */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full md:w-auto px-8 py-3 rounded-lg text-white font-medium ${
                isLoading 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300"
              }`}
            >
              {isLoading ? "保存中..." : "避難所を保存"}
            </button>
          </div>
        </form>
      </div>

      {/* 修正: 避難所一覧 - 現在の避難者数を表示のみに変更 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">登録済み避難所一覧 ({shelters.length}件)</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-2 text-left">名称</th>
                <th className="border p-2 text-left">住所</th>
                <th className="border p-2 text-left">収容人数</th>
                <th className="border p-2 text-left">現在の避難者</th>
                <th className="border p-2 text-left">災害対応</th>
                <th className="border p-2 text-left">備蓄状況</th>
                <th className="border p-2 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {shelters.length === 0 ? (
                <tr>
                  <td colSpan="7" className="border p-4 text-center text-gray-500">
                    登録された避難所がありません
                  </td>
                </tr>
              ) : (
                shelters.map((shelter) => {
                  const stockData = shelter.stock || {};
                  const disasterTypes = stockData.disaster_types || '-';
                  
                  return (
                    <tr key={shelter.id}>
                      <td className="border p-2 font-medium">{shelter.name}</td>
                      <td className="border p-2 text-sm">{shelter.address}</td>
                      <td className="border p-2 text-center">{shelter.capacity || "-"}</td>
                      <td className="border p-2 text-center">
                        <span className="font-medium text-blue-600">
                          {shelter.current_people || 0}人
                        </span>
                      </td>
                      <td className="border p-2 text-sm">{disasterTypes}</td>
                      <td className="border p-2 text-sm">
                        <div className="flex flex-col gap-1">
                          <span className={getShelterStockStatusColor(shelter.id)}>
                            {getShelterStockStatus(shelter.id)}
                          </span>
                          <button
                            onClick={async () => {
                              const stockItems = await fetchShelterStock(shelter.id);
                              if (stockItems.length > 0) {
                                const stockInfo = stockItems.map(item => 
                                  `${item.bihin_items?.name}: ${item.quantity}個`
                                ).join('\n');
                                alert(`${shelter.name}の備蓄状況:\n\n${stockInfo}`);
                              } else {
                                alert(`${shelter.name}には備蓄データがありません`);
                              }
                            }}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                          >
                            詳細表示
                          </button>
                        </div>
                      </td>
                      <td className="border p-2">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDelete(shelter.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                          >
                            削除
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}