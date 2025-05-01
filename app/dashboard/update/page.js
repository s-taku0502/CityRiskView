const updates = [
    {
        title: "2023年10月",
        content: "新しい機能を追加しました。"
    },
    {
        title: "2023年9月",
        content: "バグを修正しました。"
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