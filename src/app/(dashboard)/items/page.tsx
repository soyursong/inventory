"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import { UNIT_LABELS } from "@/lib/utils";

interface Item {
  id: string;
  name: string;
  sku: string;
  unit: string;
  manufacturer: string | null;
  safetyStock: number;
  totalStock: number;
  category: { id: string; name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "", sku: "", categoryId: "", unit: "EA",
    manufacturer: "", safetyStock: 0, expiryManaged: false, description: "",
  });

  const fetchItems = () => {
    setLoading(true);
    fetch(`/api/items?search=${search}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, [search]);
  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, []);

  const handleCreate = async () => {
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowModal(false);
      setForm({ name: "", sku: "", categoryId: "", unit: "EA", manufacturer: "", safetyStock: 0, expiryManaged: false, description: "" });
      fetchItems();
    } else {
      const err = await res.json();
      alert(err.error || "등록에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">품목 관리</h1>
        <Button onClick={() => setShowModal(true)}>+ 품목 등록</Button>
      </div>

      <Input
        placeholder="품목명 또는 SKU로 검색..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">품목명</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">SKU</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">카테고리</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">단위</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">재고</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 hidden md:table-cell">안전재고</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">로딩 중...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">품목이 없습니다.</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/items/${item.id}`} className="text-blue-600 hover:underline font-medium">
                        {item.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.sku}</td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{item.category?.name || "-"}</td>
                    <td className="px-4 py-3">{UNIT_LABELS[item.unit] || item.unit}</td>
                    <td className="px-4 py-3 text-right font-medium">{item.totalStock.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-500 hidden md:table-cell">{item.safetyStock}</td>
                    <td className="px-4 py-3 text-center">
                      {item.totalStock < item.safetyStock && item.safetyStock > 0 ? (
                        <Badge status="FAIL" />
                      ) : (
                        <Badge status="PASS" />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="품목 등록" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="품목명 *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="SKU *" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="카테고리"
              placeholder="선택"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            />
            <Select
              label="단위"
              options={Object.entries(UNIT_LABELS).map(([k, v]) => ({ value: k, label: v }))}
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="제조사" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
            <Input label="안전재고" type="number" value={form.safetyStock} onChange={(e) => setForm({ ...form, safetyStock: parseInt(e.target.value) || 0 })} />
          </div>
          <Input label="설명" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.expiryManaged} onChange={(e) => setForm({ ...form, expiryManaged: e.target.checked })} className="rounded" />
            <span className="text-sm text-gray-700">유효기한 관리</span>
          </label>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="ghost" onClick={() => setShowModal(false)}>취소</Button>
            <Button onClick={handleCreate}>등록</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
