"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";

interface Category {
  id: string;
  name: string;
  description: string | null;
  parent: { id: string; name: string } | null;
  children: { id: string; name: string }[];
  _count: { items: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", parentId: "" });

  const fetchCategories = () => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleCreate = async () => {
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowModal(false);
      setForm({ name: "", description: "", parentId: "" });
      fetchCategories();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">카테고리 관리</h1>
        <Button onClick={() => setShowModal(true)}>+ 카테고리 추가</Button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">카테고리명</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">설명</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">상위 카테고리</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">품목 수</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{cat.name}</td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{cat.description || "-"}</td>
                <td className="px-4 py-3 text-gray-500">{cat.parent?.name || "-"}</td>
                <td className="px-4 py-3 text-right">{cat._count.items}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="카테고리 추가">
        <div className="space-y-4">
          <Input label="카테고리명 *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="설명" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Select
            label="상위 카테고리"
            placeholder="없음 (최상위)"
            options={categories.filter((c) => !c.parent).map((c) => ({ value: c.id, label: c.name }))}
            value={form.parentId}
            onChange={(e) => setForm({ ...form, parentId: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="ghost" onClick={() => setShowModal(false)}>취소</Button>
            <Button onClick={handleCreate}>추가</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
