"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

interface Location {
  id: string;
  code: string;
  name: string;
  floor: string;
  zone: string;
  shelf: string;
  description: string | null;
  _count: { inventoryStocks: number };
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [form, setForm] = useState({ name: "", floor: "", zone: "", shelf: "", description: "" });

  const fetchLocations = () => {
    fetch(`/api/locations?search=${search}`).then((r) => r.json()).then(setLocations);
  };

  useEffect(() => { fetchLocations(); }, [search]);

  const handleCreate = async () => {
    const res = await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowModal(false);
      setForm({ name: "", floor: "", zone: "", shelf: "", description: "" });
      fetchLocations();
    } else {
      const err = await res.json();
      alert(err.error);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBatchPrint = async () => {
    if (selectedIds.length === 0) return alert("출력할 위치를 선택해주세요.");
    const res = await fetch("/api/locations/print-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locationIds: selectedIds }),
    });
    const data = await res.json();
    if (data.labels) {
      // Open print window with QR labels
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;
      printWindow.document.write(`
        <html><head><title>QR 라벨 출력</title>
        <style>
          body { font-family: sans-serif; margin: 0; padding: 20px; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
          .label { border: 1px dashed #ccc; padding: 12px; text-align: center; page-break-inside: avoid; }
          .label img { width: 120px; height: 120px; }
          .code { font-size: 18px; font-weight: bold; margin-top: 8px; }
          .name { font-size: 12px; color: #666; margin-top: 4px; }
          @media print { .grid { gap: 8px; } .label { border: 1px solid #eee; } }
        </style></head><body>
        <div class="grid">
          ${data.labels.map((l: { qrDataUrl: string; code: string; name: string }) => `
            <div class="label">
              <img src="${l.qrDataUrl}" />
              <div class="code">${l.code}</div>
              <div class="name">${l.name}</div>
            </div>
          `).join("")}
        </div>
        <script>window.onload=function(){window.print()}</script>
        </body></html>
      `);
    }
  };

  const handlePrintSingle = async (locationId: string) => {
    window.open(`/api/locations/${locationId}/qrcode`, "_blank");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-900">보관 위치 관리</h1>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button variant="outline" onClick={handleBatchPrint}>
              QR 일괄 출력 ({selectedIds.length})
            </Button>
          )}
          <Button onClick={() => setShowModal(true)}>+ 위치 추가</Button>
        </div>
      </div>

      <Input placeholder="위치코드 또는 이름으로 검색..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  onChange={(e) => setSelectedIds(e.target.checked ? locations.map((l) => l.id) : [])}
                  checked={selectedIds.length === locations.length && locations.length > 0}
                  className="rounded"
                />
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">위치코드</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">이름</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">층</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">구역</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">재고 종류</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">QR</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {locations.map((loc) => (
              <tr key={loc.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(loc.id)}
                    onChange={() => toggleSelect(loc.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-3 font-mono font-medium">{loc.code}</td>
                <td className="px-4 py-3">{loc.name}</td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{loc.floor}</td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{loc.zone}</td>
                <td className="px-4 py-3 text-right">{loc._count.inventoryStocks}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => handlePrintSingle(loc.id)} className="text-blue-600 hover:underline text-xs">
                    QR 보기
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="보관 위치 추가">
        <div className="space-y-4">
          <Input label="위치 이름 *" placeholder="예: 1층 약품창고 A-03번 선반" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="층 *" placeholder="1F" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} />
            <Input label="구역 *" placeholder="A" value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} />
            <Input label="선반번호 *" placeholder="03" value={form.shelf} onChange={(e) => setForm({ ...form, shelf: e.target.value })} />
          </div>
          <p className="text-sm text-gray-500">위치 코드: <span className="font-mono font-bold">{form.floor}-{form.zone}-{form.shelf}</span></p>
          <Input label="설명" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="ghost" onClick={() => setShowModal(false)}>취소</Button>
            <Button onClick={handleCreate}>추가</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
