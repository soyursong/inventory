"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function NewReconciliationPage() {
  const router = useRouter();
  const [yearMonth, setYearMonth] = useState(new Date().toISOString().slice(0, 7));
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    const res = await fetch("/api/reconciliation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ yearMonth, notes }),
    });

    if (res.ok) {
      const session = await res.json();
      router.push(`/reconciliation/${session.id}`);
    } else {
      const err = await res.json();
      alert(err.error || "실사 세션 생성에 실패했습니다.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-2">&larr; 실사 목록</button>
        <h1 className="text-2xl font-bold text-gray-900">새 실사 시작</h1>
        <p className="text-gray-500 text-sm mt-1">현재 재고 현황을 기준으로 실사 항목이 자동 생성됩니다.</p>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <Input label="실사 년월 *" type="month" value={yearMonth} onChange={(e) => setYearMonth(e.target.value)} />
        <Input label="비고" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="실사 관련 메모" />
        <Button onClick={handleCreate} loading={loading} className="w-full" size="lg">
          실사 세션 생성
        </Button>
      </div>
    </div>
  );
}
