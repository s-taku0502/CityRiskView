'use client'

export default function EmergencyContacts() {
  const emergencyNumbers = [
    {
      name: '警察',
      number: '110',
      description: '事件・事故・緊急事態',
      category: 'emergency'
    },
    {
      name: '消防・救急',
      number: '119',
      description: '火災・救急・救助',
      category: 'emergency'
    },
    {
      name: '海上保安庁',
      number: '118',
      description: '海での事故・事件',
      category: 'emergency'
    }
  ]

  const localContacts = [
    // {
    //   name: '市役所防災課',
    //   number: '03-1234-5678',
    //   description: '災害情報・避難指示',
    //   category: 'local'
    // },
    {
      name: '災害用伝言ダイヤル',
      number: '171',
      description: '安否確認メッセージ',
      category: 'disaster'
    },
    {
      name: '災害用ブロードバンド',
      number: 'web171',
      description: 'インターネット安否確認',
      category: 'web'
    }
  ]

  const handleCall = (number) => {
    if (number.startsWith('web')) {
      window.open('https://www.web171.jp/', '_blank')
    } else {
      window.location.href = `tel:${number}`
    }
  }

  return (
    <div className="space-y-6">
      {/* 緊急通報 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4 text-red-600">
          緊急通報
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {emergencyNumbers.map((contact, index) => (
            <div
              key={index}
              className="border-2 border-red-200 rounded-lg p-4 hover:border-red-400 transition-colors cursor-pointer"
              onClick={() => handleCall(contact.number)}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 mb-1">
                  {contact.number}
                </div>
                <div className="font-medium text-gray-800">{contact.name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {contact.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 災害関連連絡先 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4 text-blue-600">
          災害関連連絡先
        </h3>
        <div className="flex flex-wrap justify-center gap-4">
          {localContacts.map((contact, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors cursor-pointer w-80"
              onClick={() => handleCall(contact.number)}
            >
              <div className="text-center">
                <div className="font-medium text-gray-800 mb-1">{contact.name}</div>
                <div className="text-blue-600 font-bold text-lg">{contact.number}</div>
                <div className="text-sm text-gray-600">{contact.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 緊急連絡先の使い方 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h4 className="font-bold text-yellow-800 mb-3">
          緊急連絡先の使い方
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-medium text-yellow-700 mb-2">通報時のポイント</h5>
            <ul className="text-sm text-yellow-600 space-y-1">
              <li>• 落ち着いて正確に状況を伝える</li>
              <li>• 場所を正確に伝える</li>
              <li>• けが人の有無を伝える</li>
              <li>• 指示があるまで電話を切らない</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-yellow-700 mb-2">災害用伝言サービス</h5>
            <ul className="text-sm text-yellow-600 space-y-1">
              <li>• 171: 音声での安否確認</li>
              <li>• web171: インターネットで安否確認</li>
              <li>• 大規模災害時に開設される</li>
              <li>• 家族間で使い方を確認しておく</li>
            </ul>
          </div>
        </div>
      </div>

      {/* アプリ・サービス */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4 text-green-600">
          災害情報アプリ・サービス
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-800 mb-2">気象庁</h5>
            <p className="text-sm text-gray-600 mb-2">
              気象情報・警報・地震情報
            </p>
            <a
              href="https://www.jma.go.jp/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 text-sm hover:underline"
            >
              ウェブサイトを開く →
            </a>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-800 mb-2">NHK ニュース・防災</h5>
            <p className="text-sm text-gray-600 mb-2">
              災害情報・ニュース・避難情報
            </p>
            <a
              href="https://www3.nhk.or.jp/news/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 text-sm hover:underline"
            >
              ウェブサイトを開く →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}