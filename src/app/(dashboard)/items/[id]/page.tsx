"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { UNIT_LABELS } from "@/lib/utils";

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/items/${params.id}`)
      .then((r) => r.json())
      .then(setItem)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  if (!item) return <div className="text-center py-12 text-gray-500">품목을 찾을 수 없습니다.</div>;

  const stocks = (item.inventoryStocks as Array<{ id: string; quantity: number; lotNumber: string | null; expiryDate: string | null; location: { code: string; name: string } }>) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-2">&larr; 품목 목록</button>
          <h1 className="text-2xl font-bold text-gray-900">{item.name as string}</h1>
          <p className="text-gray-500">SKU: {item.sku as string}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold">기본 정보</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-gray-500">카테고리</p><p className="font-medium">{(item.category as Record<string, string>)?.name || "-"}</p></div>
            <div><p className="text-gray-500">단위</p><p className="font-medium">{UNIT_LABELS[item.unit as string] || item.unit}</p></div>
            <div><p className="text-gray-500">제조사</p><p className="font-medium">{(item.manufacturer as string) || "-"}</p></div>
            <div><p className="text-gray-500">안전재고</p><p className="font-medium">{item.safetyStock as number}</p></div>
            <div><p className="text-gray-500">유효기한 관리</p><p className="font-medium">{item.expiryManaged ? "예" : "아니오"}</p></div>
          </div>
          {item.description && <div><p className="text-gray-500 text-sm">설명</p><p className="text-sm">{item.description as string}</p></div>}
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">위치별 재고</h2>
          {stocks.length === 0 ? (
            <p className="text-sm text-gray-500">등록된 재고가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {stocks.map((stock) => (
                <div key={stock.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{stock.location.code} - {stock.location.name}</p>
                    {stock.lotNumber && <p className="text-xs text-gray-500">LOT: {stock.lotNumber}</p>}
                    {stock.expiryDate && <p className="text-xs text-gray-500">유효기한: {new Date(stock.expiryDate).toLocaleDateString("ko-KR")}</p>}
                  </div>
                  <p className="text-lg font-bold">{stock.quantity}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
