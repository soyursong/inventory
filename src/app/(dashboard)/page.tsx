"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";

interface DashboardStats {
  totalItems: number;
  totalStock: number;
  lowStockItems: number;
  pendingInbound: number;
  todayOutbound: number;
  activeReconciliation: boolean;
  recentActivity: {
    id: string;
    action: string;
    entityType: string;
    createdAt: string;
    user?: { name: string };
  }[];
  lowStockAlerts: {
    id: string;
    name: string;
    sku: string;
    totalQuantity: number;
    safetyStock: number;
  }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const cards = [
    { label: "총 품목 수", value: stats?.totalItems || 0, color: "blue", href: "/items" },
    { label: "총 재고 수량", value: stats?.totalStock || 0, color: "green", href: "/items" },
    { label: "재고 부족 품목", value: stats?.lowStockItems || 0, color: "red", href: "/items" },
    { label: "입고 대기", value: stats?.pendingInbound || 0, color: "yellow", href: "/inbound" },
    { label: "오늘 출고", value: stats?.todayOutbound || 0, color: "purple", href: "/outbound" },
  ];

  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    red: "bg-red-50 text-red-700 border-red-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`rounded-xl border p-4 ${colorClasses[card.color]} hover:shadow-md transition-shadow`}
          >
            <p className="text-sm font-medium opacity-75">{card.label}</p>
            <p className="text-2xl font-bold mt-1">{card.value.toLocaleString()}</p>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">재고 부족 알림</h2>
          {stats?.lowStockAlerts && stats.lowStockAlerts.length > 0 ? (
            <div className="space-y-3">
              {stats.lowStockAlerts.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">{item.totalQuantity}개</p>
                    <p className="text-xs text-gray-500">안전재고: {item.safetyStock}개</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">재고 부족 품목이 없습니다.</p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 활동</h2>
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge status={log.action} />
                    <div>
                      <p className="text-sm text-gray-700">{log.entityType}</p>
                      <p className="text-xs text-gray-500">{log.user?.name}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(log.createdAt).toLocaleString("ko-KR")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">최근 활동이 없습니다.</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 실행</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/inbound/new" className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-blue-50 hover:border-blue-200 transition-colors">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            <span className="text-sm font-medium text-gray-700">입고 등록</span>
          </Link>
          <Link href="/outbound/sync" className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-purple-50 hover:border-purple-200 transition-colors">
            <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm font-medium text-gray-700">CRM 동기화</span>
          </Link>
          <Link href="/mobile/scan" className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-green-50 hover:border-green-200 transition-colors">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">QR 스캔</span>
          </Link>
          <Link href="/reconciliation/new" className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-orange-50 hover:border-orange-200 transition-colors">
            <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span className="text-sm font-medium text-gray-700">재고 실사</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
