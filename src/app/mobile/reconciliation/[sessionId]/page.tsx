"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { UNIT_LABELS } from "@/lib/utils";

interface RecItem {
  id: string;
  systemQty: number;
  actualQty: number | null;
  status: string;
  item: { name: string; sku: string; unit: string };
  location: { id: string; code: string; name: string };
}

export default function MobileReconciliationPage() {
  const params = useParams();
  const router = useRouter();
  const [session, setSession] = useState<any | null>(null);
  const [currentLocationId, setCurrentLocationId] = useState<string | null>(null);
  const [checkData, setCheckData] = useState<Record<string, { actualQty: number; reason: string }>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/reconciliation/${params.sessionId}`)
      .then((r) => r.json())
      .then(setSession);
  }, [params.sessionId]);

  if (!session) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  const items = (session.items as RecItem[]) || [];
  const locations = Array.from(new Map(items.map((i) => [i.location.id, i.location])).values());
  const currentItems = currentLocationId ? items.filter((i) => i.location.id === currentLocationId) : [];

  const handleSave = async () => {
    setSaving(true);
    const checkItems = Object.entries(checkData).map(([id, data]) => ({
      id,
      actualQty: data.actualQty,
      reason: data.reason,
    }));

    await fetch(`/api/reconciliation/${params.sessionId}/check`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: checkItems }),
    });

    setSaving(false);
    setCurrentLocationId(null);
    setCheckData({});
    // Refresh
    const res = await fetch(`/api/reconciliation/${params.sessionId}`);
    setSession(await res.json());
  };

  if (!currentLocationId) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">{session.yearMonth as string} 실사</h1>
        <p className="text-sm text-gray-500">실사할 위치를 선택하세요</p>

        {locations.map((loc) => {
          const locItems = items.filter((i) => i.location.id === loc.id);
          const checked = locItems.filter((i) => i.status !== "PENDING").length;
          return (
            <button
              key={loc.id}
              onClick={() => setCurrentLocationId(loc.id)}
              className="w-full bg-white rounded-xl border p-4 text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono font-bold text-lg">{loc.code}</p>
                  <p className="text-sm text-gray-500">{loc.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{checked}/{locItems.length}</p>
                  <p className="text-xs text-gray-500">완료</p>
                </div>
              </div>
            </button>
          );
        })}

        <Button variant="outline" onClick={() => router.push("/mobile/scan")} className="w-full">
          QR 스캔으로 위치 찾기
        </Button>
      </div>
    );
  }

  const location = locations.find((l) => l.id === currentLocationId)!;

  return (
    <div className="space-y-4">
      <button onClick={() => setCurrentLocationId(null)} className="text-sm text-gray-500">&larr; 위치 목록</button>
      <div className="bg-blue-600 text-white rounded-xl p-4">
        <p className="text-blue-200 text-sm">실사 진행 중</p>
        <h1 className="text-2xl font-bold">{location.code}</h1>
        <p className="text-blue-100">{location.name}</p>
      </div>

      {currentItems.map((item) => (
        <div key={item.id} className={`bg-white rounded-xl border p-4 ${item.status !== "PENDING" ? "opacity-60" : ""}`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-medium">{item.item.name}</p>
              <p className="text-xs text-gray-500">{item.item.sku}</p>
            </div>
            <p className="text-sm text-gray-500">시스템: {item.systemQty} {UNIT_LABELS[item.item.unit]}</p>
          </div>
          {item.status === "PENDING" ? (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="number"
                className="w-24 rounded border px-2 py-1 text-sm"
                placeholder="실제 수량"
                value={checkData[item.id]?.actualQty ?? ""}
                onChange={(e) => setCheckData({
                  ...checkData,
                  [item.id]: { actualQty: parseInt(e.target.value) || 0, reason: checkData[item.id]?.reason || "" },
                })}
              />
              <input
                className="flex-1 rounded border px-2 py-1 text-sm"
                placeholder="사유"
                value={checkData[item.id]?.reason || ""}
                onChange={(e) => setCheckData({
                  ...checkData,
                  [item.id]: { actualQty: checkData[item.id]?.actualQty || 0, reason: e.target.value },
                })}
              />
            </div>
          ) : (
            <p className="text-sm text-green-600">체크 완료 (실제: {item.actualQty})</p>
          )}
        </div>
      ))}

      <Button onClick={handleSave} loading={saving} className="w-full" size="lg">
        저장
      </Button>
    </div>
  );
}
