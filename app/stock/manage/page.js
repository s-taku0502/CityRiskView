import CountEditPage from "@/app/stock/components/CountEditPage";
import { Suspense } from "react";

export default function Page() {

  return (
    <Suspense fallback={<div className="p-6">読み込み中...</div>}>
      <CountEditPage />;
    </Suspense>
  )
}