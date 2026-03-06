"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";

interface ReconciliationItem {
  id: string;
  systemQty: number;
  actualQty: number | null;
  difference: number | null;
  reason: string | null;
  status: string;
  item: { name: string; sku: string; unit: string };
  location: { code: string; name: string };
  checkedBy: { name: string } | null;
}

export default function ReconciliationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [session, setSession] = useState<any | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [checkData, setCheckData] = useState<Record<string, { actualQty: number; reason: string }>>({});
  const [loading, setLoading] = useState(false);

  const fetchSession = () => {
    fetch(`/api/reconciliation/${params.id}`).then((r) => r.json()).then(setSession);
  };

  useEffect(() => { fetchSession(); }, [params.id]);

  if (!session) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  const items = (session.items as ReconciliationItem[]) || [];
  const pendingItems = items.filter((i) => i.status === "PENDING");
  const checkedItems = items.filter((i) => i.status === "CHECKED");
  const status = session.status as string;

  const handleCheck = async () => {
    setLoading(true);
    const checkItems = Object.entries(checkData).map(([id, data]) => ({
      id,
      actualQty: data.actualQty,
      reason: data.reason,
    }));

    await fetch(`/api/reconciliation/${params.id}/check`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: checkItems }),
    });

    setEditMode(false);
    setCheckData({});
    setLoading(false);
    fetchSession();
  };

  const handleApprove = async (itemIds: string[]) => {
    await fetch(`/api/reconciliation/${params.id}/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemIds, action: "approve" }),
    });
    fetchSession();
  };

  const handleComplete = async () => {
    if (!confirm("실사를 완료하고 재고를 조정하시겠습니까?")) return;
    await fetch(`/api/reconciliation/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete" }),
    });
    fetchSession();
  };

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">&larr; 실사 목록</button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{session.yearMonth as string} 재고 실사</h1>
          <p className="text-sm text-gray-500">총 {items.length}개 항목</p>
        </div>
        <div className="flex gap-2">
          <Badge status={status} />
          {status === "IN_PROGRESS" && !editMode && (
            <Button onClick={() => setEditMode(true)}>실사 입력</Button>
          )}
          {status === "IN_PROGRESS" && checkedItems.length > 0 && (
            <Button variant="outline" onClick={() => handleApprove(checkedItems.map((i) => i.id))}>
              전체 승인 ({checkedItems.length})
            </Button>
          )}
          {status === "IN_PROGRESS" && (
            <Button variant="secondary" onClick={handleComplete}>실사 완료</Button>
          )}
        </div>
      </div>

      {editMode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-700 font-medium mb-2">실사 입력 모드 - 실제 수량을 입력하세요</p>
          <div className="space-y-3">
            {pendingItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg p-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-medium">{item.item.name}</p>
                  <p className="text-xs text-gray-500">{item.location.code} | 시스템 수량: {item.systemQty}</p>
                </div>
                <Input
                  type="number"
                  className="w-24"
                  placeholder="실제"
                  value={checkData[item.id]?.actualQty ?? ""}
                  onChange={(e) => setCheckData({
                    ...checkData,
                    [item.id]: { actualQty: parseInt(e.target.value) || 0, reason: checkData[item.id]?.reason || "" },
                  })}
                />
                <Input
                  className="w-48"
                  placeholder="사유 (차이 시)"
                  value={checkData[item.id]?.reason || ""}
                  onChange={(e) => setCheckData({
                    ...checkData,
                    [item.id]: { actualQty: checkData[item.id]?.actualQty || 0, reason: e.target.value },
                  })}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => { setEditMode(false); setCheckData({}); }}>취소</Button>
            <Button onClick={handleCheck} loading={loading}>저장</Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">위치</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">품목</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">시스템</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">실제</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">차이</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">사유</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item) => (
              <tr key={item.id} className={item.difference && item.difference !== 0 ? "bg-red-50" : ""}>
                <td className="px-4 py-3 font-mono text-sm">{item.location.code}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{item.item.name}</p>
                  <p className="text-xs text-gray-500">{item.item.sku}</p>
                </td>
                <td className="px-4 py-3 text-right">{item.systemQty}</td>
                <td className="px-4 py-3 text-right font-medium">{item.actualQty ?? "-"}</td>
                <td className={`px-4 py-3 text-right font-bold ${
                  item.difference && item.difference !== 0
                    ? item.difference > 0 ? "text-green-600" : "text-red-600"
                    : ""
                }`}>
                  {item.difference !== null ? (item.difference > 0 ? `+${item.difference}` : item.difference) : "-"}
                </td>
                <td className="px-4 py-3 text-gray-500 text-sm hidden md:table-cell">{item.reason || "-"}</td>
                <td className="px-4 py-3 text-center"><Badge status={item.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
