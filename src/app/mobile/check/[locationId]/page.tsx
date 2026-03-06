"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { UNIT_LABELS } from "@/lib/utils";

interface StockItem {
  id: string;
  quantity: number;
  lotNumber: string | null;
  expiryDate: string | null;
  item: {
    id: string;
    name: string;
    sku: string;
    unit: string;
    safetyStock: number;
    expiryManaged: boolean;
  };
}

interface CheckItem {
  stockId: string;
  checked: boolean;
  actualQty: number;
  condition: "ok" | "damaged" | "expired" | "";
  note: string;
}

export default function MobileCheckPage() {
  const params = useParams();
  const router = useRouter();
  const [location, setLocation] = useState<any | null>(null);
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [checks, setChecks] = useState<Record<string, CheckItem>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/locations/${params.locationId}/stock`)
      .then((r) => r.json())
      .then((data) => {
        setLocation(data);
        const inventoryStocks = (data.inventoryStocks || []) as StockItem[];
        setStocks(inventoryStocks);
        // Initialize check state
        const initial: Record<string, CheckItem> = {};
        inventoryStocks.forEach((s) => {
          initial[s.id] = { stockId: s.id, checked: false, actualQty: s.quantity, condition: "", note: "" };
        });
        setChecks(initial);
      })
      .finally(() => setLoading(false));
  }, [params.locationId]);

  const updateCheck = (stockId: string, field: string, value: unknown) => {
    setChecks((prev) => ({
      ...prev,
      [stockId]: { ...prev[stockId], [field]: value },
    }));
  };

  const toggleCheck = (stockId: string) => {
    setChecks((prev) => ({
      ...prev,
      [stockId]: { ...prev[stockId], checked: !prev[stockId].checked },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    // Save check results (could be used for reconciliation)
    const checkedItems = Object.values(checks).filter((c) => c.checked);
    console.log("Checked items:", checkedItems);
    // In real app, this would call an API to save the check results
    alert(`${checkedItems.length}개 항목 체크 완료!`);
    setSaving(false);
    router.push("/mobile/scan");
  };

  const checkedCount = Object.values(checks).filter((c) => c.checked).length;
  const totalCount = stocks.length;

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  if (!location) return <div className="text-center py-12 text-gray-500">위치를 찾을 수 없습니다.</div>;

  return (
    <div className="space-y-4">
      {/* Location Header */}
      <div className="bg-blue-600 text-white rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-sm">보관 위치</p>
            <h1 className="text-2xl font-bold">{location.code as string}</h1>
            <p className="text-blue-100">{location.name as string}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{checkedCount}/{totalCount}</p>
            <p className="text-blue-200 text-sm">체크 완료</p>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="mt-3 bg-blue-800 rounded-full h-2">
          <div
            className="bg-white h-2 rounded-full transition-all"
            style={{ width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Stock Items Checklist */}
      {stocks.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
          이 위치에 재고가 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {stocks.map((stock) => {
            const check = checks[stock.id];
            const isLowStock = stock.quantity < stock.item.safetyStock && stock.item.safetyStock > 0;
            const isExpiringSoon = stock.expiryDate && new Date(stock.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            return (
              <div
                key={stock.id}
                className={`bg-white rounded-xl border p-4 transition-all ${
                  check?.checked ? "border-green-500 bg-green-50" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleCheck(stock.id)}
                    className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      check?.checked ? "bg-green-500 border-green-500" : "border-gray-300"
                    }`}
                  >
                    {check?.checked && (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">{stock.item.name}</h3>
                      <span className="text-lg font-bold text-gray-900">
                        {stock.quantity} {UNIT_LABELS[stock.item.unit]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{stock.item.sku}</p>

                    {/* Alerts */}
                    <div className="flex gap-2 mt-2">
                      {isLowStock && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">재고 부족</span>
                      )}
                      {isExpiringSoon && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">유효기한 임박</span>
                      )}
                      {stock.lotNumber && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">LOT: {stock.lotNumber}</span>
                      )}
                    </div>

                    {/* Expanded check form */}
                    {check?.checked && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-500 w-16">실제 수량</label>
                          <input
                            type="number"
                            className="w-20 rounded border px-2 py-1 text-sm"
                            value={check.actualQty}
                            onChange={(e) => updateCheck(stock.id, "actualQty", parseInt(e.target.value) || 0)}
                          />
                          {check.actualQty !== stock.quantity && (
                            <span className={`text-xs font-bold ${check.actualQty < stock.quantity ? "text-red-600" : "text-green-600"}`}>
                              ({check.actualQty - stock.quantity > 0 ? "+" : ""}{check.actualQty - stock.quantity})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-500 w-16">상태</label>
                          <div className="flex gap-1">
                            {[
                              { value: "ok", label: "정상", color: "green" },
                              { value: "damaged", label: "파손", color: "red" },
                              { value: "expired", label: "만료", color: "yellow" },
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => updateCheck(stock.id, "condition", opt.value)}
                                className={`text-xs px-2 py-1 rounded border ${
                                  check.condition === opt.value
                                    ? `bg-${opt.color}-100 border-${opt.color}-500 text-${opt.color}-700`
                                    : "border-gray-200"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t">
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push("/mobile/scan")} className="flex-1">
            다른 위치 스캔
          </Button>
          <Button onClick={handleSave} loading={saving} className="flex-1" disabled={checkedCount === 0}>
            체크 완료 ({checkedCount})
          </Button>
        </div>
      </div>
    </div>
  );
}
