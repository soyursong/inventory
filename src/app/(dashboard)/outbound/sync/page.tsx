"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface SyncResult {
  total: number;
  synced: number;
  skipped: number;
  errors: string[];
  lowStockAlerts: string[];
}

export default function CRMSyncPage() {
  const router = useRouter();
  const [fromDate, setFromDate] = useState(new Date().toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  const handleSync = async () => {
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/outbound/crm-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromDate, toDate }),
    });

    const data = await res.json();
    if (res.ok) {
      setResult(data);
    } else {
      alert(data.error || "동기화에 실패했습니다.");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-2">&larr; 출고 목록</button>
        <h1 className="text-2xl font-bold text-gray-900">CRM 동기화</h1>
        <p className="text-gray-500 text-sm mt-1">외부 CRM에서 소진 데이터를 가져와 재고를 자동 차감합니다.</p>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="text-lg font-semibold">동기화 기간 설정</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input label="시작일" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <Input label="종료일" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <Button onClick={handleSync} loading={loading} className="w-full" size="lg">
          CRM 데이터 동기화 실행
        </Button>
      </div>

      {result && (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold">동기화 결과</h2>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">{result.total}</p>
              <p className="text-sm text-blue-600">총 건수</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-700">{result.synced}</p>
              <p className="text-sm text-green-600">동기화 성공</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-700">{result.skipped}</p>
              <p className="text-sm text-gray-600">중복 건너뜀</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-700 mb-2">오류 ({result.errors.length}건)</h3>
              <ul className="text-sm text-red-600 space-y-1">
                {result.errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}

          {result.lowStockAlerts.length > 0 && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-yellow-700 mb-2">재고 부족 알림 ({result.lowStockAlerts.length}건)</h3>
              <ul className="text-sm text-yellow-600 space-y-1">
                {result.lowStockAlerts.map((alert, i) => <li key={i}>{alert}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
