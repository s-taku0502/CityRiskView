const updates = [
    {
        title: "2025年6月7日",
        content: "一般利用者向けのURLを調整しました。\n今後は https://cityriskview.vercel.app/ よりアクセスできます。"
    },
    {
        title: "2025年5月23日",
        content: "地図のメンテナンスを開始しました。\nまた、避難情報画面（サンプル）を作成しました。"
    },
    {
        title: "2025年5月3日",
        content: "地図画面の細微なバグを修正しました。"
    },
    {
        title: "2025年5月2日",
        content: "地図画面を修正しました。"
    },
    {
        title: "2025年5月1日",
        content: "サイトを公開しました。"
    }
];

// ユーティリティ関数：URLと改行を処理して整形されたJSXを返す
function renderContent(content) {
    const lines = content.split('\n');
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return lines.map((line, lineIndex) => {
        const parts = line.split(urlRegex);

        return (
            <p key={lineIndex} className="mb-1">
                {parts.map((part, i) =>
                    urlRegex.test(part) ? (
                        <a
                            key={i}
                            href={part}
                            className="text-blue-600 underline break-all"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {part}
                        </a>
                    ) : (
                        <span key={i}>{part}</span>
                    )
                )}
            </p>
        );
    });
}

export default function UpdatePage() {
    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4 pt-4">更新情報</h2>
            <div className="grid gap-4">
                {updates.map((update, index) => (
                    <div
                        key={index}
                        className="p-4 bg-white shadow rounded-lg"
                    >
                        <h3 className="font-semibold text-lg mb-2">
                            {update.title}
                        </h3>
                        {renderContent(update.content)}
                    </div>
                ))}
            </div>
        </div>
    );
}
