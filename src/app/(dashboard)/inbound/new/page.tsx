"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

interface Supplier { id: string; name: string }
interface Item { id: string; name: string; sku: string; unit: string }
interface Location { id: string; code: string; name: string }
interface OrderItem { itemId: string; expectedQty: number; locationId: string; lotNumber: string; expiryDate: string }

export default function NewInboundPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);

  const [supplierId, setSupplierId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { itemId: "", expectedQty: 1, locationId: "", lotNumber: "", expiryDate: "" },
  ]);

  useEffect(() => {
    Promise.all([
      fetch("/api/suppliers").then((r) => r.json()).catch(() => []),
      fetch("/api/items?limit=100").then((r) => r.json()),
      fetch("/api/locations").then((r) => r.json()),
    ]).then(([s, i, l]) => {
      setSuppliers(Array.isArray(s) ? s : []);
      setItems(i.items || []);
      setLocations(Array.isArray(l) ? l : []);
    });
  }, []);

  const addItem = () => {
    setOrderItems([...orderItems, { itemId: "", expectedQty: 1, locationId: "", lotNumber: "", expiryDate: "" }]);
  };

  const removeItem = (idx: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, value: string | number) => {
    const updated = [...orderItems];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updated[idx] as any)[field] = value;
    setOrderItems(updated);
  };

  const handleSubmit = async () => {
    if (!supplierId) return alert("공급업체를 선택해주세요.");
    if (orderItems.some((i) => !i.itemId || i.expectedQty <= 0)) return alert("품목과 수량을 확인해주세요.");

    setLoading(true);
    const res = await fetch("/api/inbound", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supplierId, expectedDate, notes, items: orderItems }),
    });

    if (res.ok) {
      const order = await res.json();
      router.push(`/inbound/${order.id}`);
    } else {
      const err = await res.json();
      alert(err.error || "등록에 실패했습니다.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-2">&larr; 입고 목록</button>
        <h1 className="text-2xl font-bold text-gray-900">입고 등록</h1>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="text-lg font-semibold">기본 정보</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Select
            label="공급업체 *"
            placeholder="선택"
            options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
          />
          <Input label="예상 입고일" type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
        </div>
        <Input label="비고" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">입고 품목</h2>
          <Button variant="outline" size="sm" onClick={addItem}>+ 품목 추가</Button>
        </div>

        {orderItems.map((oi, idx) => (
          <div key={idx} className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">품목 #{idx + 1}</span>
              {orderItems.length > 1 && (
                <button onClick={() => removeItem(idx)} className="text-red-500 text-sm hover:underline">삭제</button>
              )}
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <Select
                label="품목 *"
                placeholder="선택"
                options={items.map((i) => ({ value: i.id, label: `${i.name} (${i.sku})` }))}
                value={oi.itemId}
                onChange={(e) => updateItem(idx, "itemId", e.target.value)}
              />
              <Input label="수량 *" type="number" min={1} value={oi.expectedQty} onChange={(e) => updateItem(idx, "expectedQty", parseInt(e.target.value) || 0)} />
              <Select
                label="보관 위치"
                placeholder="나중에 지정"
                options={locations.map((l) => ({ value: l.id, label: `${l.code} - ${l.name}` }))}
                value={oi.locationId}
                onChange={(e) => updateItem(idx, "locationId", e.target.value)}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <Input label="LOT 번호" value={oi.lotNumber} onChange={(e) => updateItem(idx, "lotNumber", e.target.value)} />
              <Input label="유효기한" type="date" value={oi.expiryDate} onChange={(e) => updateItem(idx, "expiryDate", e.target.value)} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={() => router.back()}>취소</Button>
        <Button onClick={handleSubmit} loading={loading}>입고 등록</Button>
      </div>
    </div>
  );
}
