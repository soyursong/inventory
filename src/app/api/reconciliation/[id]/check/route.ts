import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function PUT(request: NextRequest, { params: _params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    // body.items: [{ id, actualQty, reason }]

    for (const item of body.items) {
      const reconciliationItem = await prisma.reconciliationItem.findUnique({
        where: { id: item.id },
      });

      if (!reconciliationItem) continue;

      const difference = item.actualQty - reconciliationItem.systemQty;

      await prisma.reconciliationItem.update({
        where: { id: item.id },
        data: {
          actualQty: item.actualQty,
          difference,
          reason: item.reason || null,
          status: "CHECKED",
          checkedById: session.user.id,
          checkedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to update check" }, { status: 500 });
  }
}

// Approve reconciliation items
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    // body.itemIds: [id, id, ...]
    // body.action: "approve" | "reject"

    const status = body.action === "approve" ? "APPROVED" : "REJECTED";

    await prisma.reconciliationItem.updateMany({
      where: {
        id: { in: body.itemIds },
        sessionId: params.id,
      },
      data: {
        status,
        approvedById: session.user.id,
        approvedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to approve items" }, { status: 500 });
  }
}
