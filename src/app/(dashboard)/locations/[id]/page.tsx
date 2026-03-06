"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { UNIT_LABELS } from "@/lib/utils";

export default function LocationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [location, setLocation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/locations/${params.id}/stock`)
      .then((r) => r.json())
      .then(setLocation)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  if (!location) return <div className="text-center py-12 text-gray-500">위치를 찾을 수 없습니다.</div>;

  const stocks = (location.inventoryStocks as Array<{ id: string; quantity: number; item: { name: string; sku: string; unit: string } }>) || [];

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">&larr; 위치 목록</button>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
          <span className="text-xl font-bold text-blue-600">{location.code as string}</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{location.name as string}</h1>
          <p className="text-gray-500">위치코드: {location.code as string}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">보관 중인 재고 ({stocks.length}종)</h2>
        {stocks.length === 0 ? (
          <p className="text-gray-500 text-sm">이 위치에 재고가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {stocks.map((stock) => (
              <div key={stock.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{stock.item.name}</p>
                  <p className="text-xs text-gray-500">{stock.item.sku} | {UNIT_LABELS[stock.item.unit]}</p>
                </div>
                <p className="text-xl font-bold">{stock.quantity}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
