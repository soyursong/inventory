"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { UNIT_LABELS, formatDate } from "@/lib/utils";
import Badge from "@/components/ui/Badge";

export default function ReportsPage() {
  const [reportType, setReportType] = useState("stock-summary");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [data, setData] = useState<unknown[] | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    const params = new URLSearchParams({ type: reportType });
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);

    const res = await fetch(`/api/reports?${params}`);
    const result = await res.json();
    setData(result.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchReport(); }, [reportType]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">리포트</h1>

      <div className="bg-white rounded-xl border p-6">
        <div className="flex flex-wrap items-end gap-4">
          <Select
            label="리포트 유형"
            options={[
              { value: "stock-summary", label: "재고 현황" },
              { value: "inbound-history", label: "입고 내역" },
              { value: "outbound-history", label: "출고 내역" },
              { value: "reconciliation-result", label: "실사 결과" },
            ]}
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          />
          {(reportType === "inbound-history" || reportType === "outbound-history") && (
            <>
              <Input label="시작일" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <Input label="종료일" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </>
          )}
          <Button onClick={fetchReport} loading={loading}>조회</Button>
        </div>
      </div>

      {data && (
        <div className="bg-white rounded-xl border overflow-hidden">
          {reportType === "stock-summary" && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">품목</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">카테고리</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">위치</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">수량</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(data as Array<{ id: string; quantity: number; item: { name: string; sku: string; unit: string; category?: { name: string } }; location: { code: string } }>).map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3"><p className="font-medium">{row.item.name}</p><p className="text-xs text-gray-500">{row.item.sku}</p></td>
                    <td className="px-4 py-3 text-gray-500">{row.item.category?.name || "-"}</td>
                    <td className="px-4 py-3 font-mono">{row.location.code}</td>
                    <td className="px-4 py-3 text-right font-medium">{row.quantity} {UNIT_LABELS[row.item.unit]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === "inbound-history" && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">주문번호</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">공급업체</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">상태</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">일자</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(data as Array<{ id: string; orderNumber: string; status: string; createdAt: string; supplier: { name: string } }>).map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-mono">{row.orderNumber}</td>
                    <td className="px-4 py-3">{row.supplier.name}</td>
                    <td className="px-4 py-3 text-center"><Badge status={row.status} /></td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(row.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === "outbound-history" && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">품목</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">수량</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">유형</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">일자</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(data as Array<{ id: string; quantity: number; type: string; createdAt: string; item: { name: string; sku: string; unit: string } }>).map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3"><p className="font-medium">{row.item.name}</p></td>
                    <td className="px-4 py-3 text-right">{row.quantity} {UNIT_LABELS[row.item.unit]}</td>
                    <td className="px-4 py-3 text-center"><Badge status={row.type} /></td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(row.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === "reconciliation-result" && (
            <div className="p-6 space-y-4">
              {(data as Array<{ id: string; yearMonth: string; status: string; createdBy: { name: string }; items: Array<{ id: string; systemQty: number; actualQty: number; difference: number; item: { name: string }; location: { code: string } }> }>).map((s) => (
                <div key={s.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{s.yearMonth} 실사</h3>
                    <Badge status={s.status} />
                  </div>
                  {s.items.filter((i) => i.difference !== 0).length > 0 ? (
                    <div className="text-sm space-y-1">
                      {s.items.filter((i) => i.difference !== 0).map((i) => (
                        <div key={i.id} className="flex justify-between text-gray-600">
                          <span>{i.location.code} - {i.item.name}</span>
                          <span className={i.difference > 0 ? "text-green-600" : "text-red-600"}>
                            {i.difference > 0 ? `+${i.difference}` : i.difference}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">차이 없음</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
