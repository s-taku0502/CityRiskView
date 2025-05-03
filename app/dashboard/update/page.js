const updates = [
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

export default function UpdatePage() {
    return (
        <div>
            <h2 className="text-xl font-bold mb-4 pt-4">更新情報</h2>
            <div className="grid gap-4 shadow rounded-lg">
                {updates.map((update, index) => (
                    <div
                        key={index}
                        className="p-4 bg-white shadow rounded-lg"
                    >
                        <h3 className="font-semibold text-lg mb-2">
                            {update.title}
                        </h3>
                        <p>{update.content}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}