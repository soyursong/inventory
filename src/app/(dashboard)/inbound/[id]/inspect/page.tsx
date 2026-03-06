"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

interface InspectionForm {
  inboundOrderItemId: string;
  status: string;
  inspectedQty: number;
  passedQty: number;
  failedQty: number;
  failReason: string;
  locationId: string;
  notes: string;
}

export default function InspectPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any | null>(null);
  const [locations, setLocations] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [inspections, setInspections] = useState<InspectionForm[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/inbound/${params.id}`).then((r) => r.json()),
      fetch("/api/locations").then((r) => r.json()),
    ]).then(([o, l]) => {
      setOrder(o);
      setLocations(Array.isArray(l) ? l : []);
      const items = (o.items as Array<{ id: string; expectedQty: number; locationId?: string }>) || [];
      setInspections(
        items.map((item) => ({
          inboundOrderItemId: item.id,
          status: "PASS",
          inspectedQty: item.expectedQty,
          passedQty: item.expectedQty,
          failedQty: 0,
          failReason: "",
          locationId: item.locationId || "",
          notes: "",
        }))
      );
    });
  }, [params.id]);

  const updateInspection = (idx: number, field: string, value: string | number) => {
    const updated = [...inspections];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updated[idx] as any)[field] = value;

    // Auto-calc
    if (field === "status") {
      if (value === "PASS") {
        updated[idx].passedQty = updated[idx].inspectedQty;
        updated[idx].failedQty = 0;
      } else if (value === "FAIL") {
        updated[idx].passedQty = 0;
        updated[idx].failedQty = updated[idx].inspectedQty;
      }
    }
    if (field === "passedQty") {
      updated[idx].failedQty = updated[idx].inspectedQty - (value as number);
    }

    setInspections(updated);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const res = await fetch(`/api/inbound/${params.id}/inspect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inspections }),
    });

    if (res.ok) {
      router.push(`/inbound/${params.id}`);
    } else {
      const err = await res.json();
      alert(err.error || "검수에 실패했습니다.");
      setLoading(false);
    }
  };

  if (!order) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  const items = (order.items as Array<{ id: string; expectedQty: number; item: { name: string; sku: string; unit: string } }>) || [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-2">&larr; 입고 상세</button>
        <h1 className="text-2xl font-bold text-gray-900">검수 진행</h1>
        <p className="text-gray-500 font-mono">{order.orderNumber as string}</p>
      </div>

      {items.map((item, idx) => (
        <div key={item.id} className="bg-white rounded-xl border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{item.item.name}</h3>
              <p className="text-sm text-gray-500">{item.item.sku} | 예상 수량: {item.expectedQty}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Select
              label="검수 결과"
              options={[
                { value: "PASS", label: "합격" },
                { value: "PARTIAL", label: "부분합격" },
                { value: "FAIL", label: "불합격" },
              ]}
              value={inspections[idx]?.status || "PASS"}
              onChange={(e) => updateInspection(idx, "status", e.target.value)}
            />
            <Input
              label="검수 수량"
              type="number"
              value={inspections[idx]?.inspectedQty || 0}
              onChange={(e) => updateInspection(idx, "inspectedQty", parseInt(e.target.value) || 0)}
            />
          </div>

          {inspections[idx]?.status === "PARTIAL" && (
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="합격 수량"
                type="number"
                value={inspections[idx]?.passedQty || 0}
                onChange={(e) => updateInspection(idx, "passedQty", parseInt(e.target.value) || 0)}
              />
              <Input
                label="불합격 수량"
                type="number"
                value={inspections[idx]?.failedQty || 0}
                disabled
              />
            </div>
          )}

          {inspections[idx]?.status !== "PASS" && (
            <Input
              label="불합격 사유"
              value={inspections[idx]?.failReason || ""}
              onChange={(e) => updateInspection(idx, "failReason", e.target.value)}
              placeholder="불합격 사유를 입력하세요"
            />
          )}

          <Select
            label="보관 위치"
            placeholder="위치 선택"
            options={locations.map((l) => ({ value: l.id, label: `${l.code} - ${l.name}` }))}
            value={inspections[idx]?.locationId || ""}
            onChange={(e) => updateInspection(idx, "locationId", e.target.value)}
          />
        </div>
      ))}

      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={() => router.back()}>취소</Button>
        <Button onClick={handleSubmit} loading={loading}>검수 완료</Button>
      </div>
    </div>
  );
}
