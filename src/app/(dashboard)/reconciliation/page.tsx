"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

interface Session {
  id: string;
  yearMonth: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  createdBy: { name: string };
  checkedCount: number;
  totalCount: number;
  progress: number;
}

export default function ReconciliationPage() {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    fetch("/api/reconciliation").then((r) => r.json()).then(setSessions);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">재고 실사</h1>
        <Link href="/reconciliation/new"><Button>+ 실사 시작</Button></Link>
      </div>

      <div className="grid gap-4">
        {sessions.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
            실사 이력이 없습니다. 새 실사를 시작해주세요.
          </div>
        ) : (
          sessions.map((s) => (
            <Link key={s.id} href={`/reconciliation/${s.id}`} className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold">{s.yearMonth} 실사</h3>
                  <p className="text-sm text-gray-500">생성: {s.createdBy.name} | {new Date(s.startedAt).toLocaleDateString("ko-KR")}</p>
                </div>
                <Badge status={s.status} />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${s.progress}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {s.checkedCount}/{s.totalCount} ({s.progress}%)
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
