export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function generateOrderNumber(): string {
  const date = new Date();
  const prefix = "IN";
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `${prefix}-${dateStr}-${random}`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    INSPECTING: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    PASS: "bg-green-100 text-green-800",
    FAIL: "bg-red-100 text-red-800",
    PARTIAL: "bg-orange-100 text-orange-800",
    PASSED: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    CANCELLED: "bg-gray-100 text-gray-800",
    CHECKED: "bg-blue-100 text-blue-800",
    APPROVED: "bg-green-100 text-green-800",
    CRM_SYNC: "bg-purple-100 text-purple-800",
    MANUAL: "bg-gray-100 text-gray-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "대기",
    INSPECTING: "검수중",
    COMPLETED: "완료",
    REJECTED: "반려",
    PASS: "합격",
    FAIL: "불합격",
    PARTIAL: "부분합격",
    PASSED: "합격",
    FAILED: "불합격",
    IN_PROGRESS: "진행중",
    CANCELLED: "취소",
    CHECKED: "확인완료",
    APPROVED: "승인",
    CRM_SYNC: "CRM 동기화",
    MANUAL: "수동",
  };
  return labels[status] || status;
}

export const UNIT_LABELS: Record<string, string> = {
  EA: "개",
  BOX: "박스",
  SET: "세트",
  PACK: "팩",
  BOTTLE: "병",
  TUBE: "튜브",
  ROLL: "롤",
  SHEET: "장",
  ML: "ml",
  L: "L",
  G: "g",
  KG: "kg",
};
