"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { formatDateTime, UNIT_LABELS } from "@/lib/utils";

export default function InboundDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/inbound/${params.id}`)
      .then((r) => r.json())
      .then(setOrder)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  if (!order) return <div className="text-center py-12 text-gray-500">입고를 찾을 수 없습니다.</div>;

  const items = (order.items as Array<{
    id: string;
    expectedQty: number;
    receivedQty: number | null;
    status: string;
    item: { name: string; sku: string; unit: string };
    inspections: Array<{ status: string; passedQty: number; failedQty: number; inspector: { name: string }; inspectedAt: string }>;
  }>) || [];

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">&larr; 입고 목록</button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">입고 상세</h1>
          <p className="text-gray-500 font-mono">{order.orderNumber as string}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge status={order.status as string} />
          {(order.status === "PENDING" || order.status === "INSPECTING") && (
            <Link href={`/inbound/${params.id}/inspect`}>
              <Button>검수 진행</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">공급업체</p>
          <p className="font-medium">{(order.supplier as Record<string, string>)?.name}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">등록자</p>
          <p className="font-medium">{(order.createdBy as Record<string, string>)?.name}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">등록일</p>
          <p className="font-medium">{formatDateTime(order.createdAt as string)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">입고 품목</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">품목</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">예상 수량</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">입고 수량</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">검수 상태</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{item.item.name}</p>
                  <p className="text-xs text-gray-500">{item.item.sku} | {UNIT_LABELS[item.item.unit]}</p>
                </td>
                <td className="px-4 py-3 text-right">{item.expectedQty}</td>
                <td className="px-4 py-3 text-right">{item.receivedQty ?? "-"}</td>
                <td className="px-4 py-3 text-center"><Badge status={item.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(order.notes as string) && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-2">비고</h2>
          <p className="text-sm text-gray-600">{order.notes as string}</p>
        </div>
      )}
    </div>
  );
}
