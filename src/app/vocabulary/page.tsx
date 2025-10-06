import React, { Suspense } from "react";
import ClientPage from "./ClientPage";

export default function VocabularyPage() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Đang tải…</div>}>
      <ClientPage />
    </Suspense>
  );
}
