"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatDateTime, UNIT_LABELS } from "@/lib/utils";

interface OutboundRecord {
  id: string;
  quantity: number;
  type: string;
  crmReferenceId: string | null;
  notes: string | null;
  createdAt: string;
  item: { name: string; sku: string; unit: string };
  location: { code: string; name: string } | null;
}

export default function OutboundPage() {
  const [records, setRecords] = useState<OutboundRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/outbound")
      .then((r) => r.json())
      .then((d) => setRecords(d.records || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">출고 관리</h1>
        <Link href="/outbound/sync"><Button>CRM 동기화</Button></Link>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">품목</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">수량</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">유형</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">위치</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">CRM Ref</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">일시</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">로딩 중...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">출고 내역이 없습니다.</td></tr>
            ) : (
              records.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{record.item.name}</p>
                    <p className="text-xs text-gray-500">{record.item.sku}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{record.quantity} {UNIT_LABELS[record.item.unit]}</td>
                  <td className="px-4 py-3 text-center"><Badge status={record.type} /></td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{record.location?.code || "-"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{record.crmReferenceId || "-"}</td>
                  <td className="px-4 py-3 text-gray-500 text-sm">{formatDateTime(record.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
