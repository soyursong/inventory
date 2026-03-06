import { NextRequest, NextResponse } from "next/server";

// Mock CRM API - 시술별 소모품 사용 데이터 반환
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  // Mock data - 실제로는 외부 CRM에서 가져옴
  const mockItems = [
    {
      crmReferenceId: `CRM-${Date.now()}-001`,
      itemSku: "MED-001",
      itemName: "일회용 주사기 3ml",
      quantity: 5,
      consumedAt: new Date().toISOString(),
      patientId: "P-001",
      procedureType: "일반 진료",
    },
    {
      crmReferenceId: `CRM-${Date.now()}-002`,
      itemSku: "MED-002",
      itemName: "알코올 솜",
      quantity: 10,
      consumedAt: new Date().toISOString(),
      patientId: "P-002",
      procedureType: "채혈",
    },
    {
      crmReferenceId: `CRM-${Date.now()}-003`,
      itemSku: "MED-003",
      itemName: "의료용 장갑 (M)",
      quantity: 4,
      consumedAt: new Date().toISOString(),
      patientId: "P-003",
      procedureType: "피부 시술",
    },
    {
      crmReferenceId: `CRM-${Date.now()}-004`,
      itemSku: "MED-004",
      itemName: "생리식염수 500ml",
      quantity: 2,
      consumedAt: new Date().toISOString(),
      patientId: "P-001",
      procedureType: "수액 치료",
    },
    {
      crmReferenceId: `CRM-${Date.now()}-005`,
      itemSku: "MED-005",
      itemName: "거즈 (10x10cm)",
      quantity: 8,
      consumedAt: new Date().toISOString(),
      patientId: "P-004",
      procedureType: "상처 소독",
    },
  ];

  return NextResponse.json({
    success: true,
    items: mockItems,
    period: { from, to },
    syncedAt: new Date().toISOString(),
  });
}
