"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

interface InboundOrder {
  id: string;
  orderNumber: string;
  status: string;
  expectedDate: string | null;
  receivedDate: string | null;
  createdAt: string;
  supplier: { name: string };
  createdBy: { name: string };
  _count: { items: number };
}

export default function InboundPage() {
  const [orders, setOrders] = useState<InboundOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/inbound")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">입고 관리</h1>
        <Link href="/inbound/new">
          <Button>+ 입고 등록</Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">주문번호</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">공급업체</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">상태</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600 hidden md:table-cell">품목 수</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">등록일</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">등록자</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">로딩 중...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">입고 내역이 없습니다.</td></tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/inbound/${order.id}`} className="text-blue-600 hover:underline font-mono">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{order.supplier.name}</td>
                  <td className="px-4 py-3 text-center"><Badge status={order.status} /></td>
                  <td className="px-4 py-3 text-right hidden md:table-cell">{order._count.items}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{order.createdBy.name}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
