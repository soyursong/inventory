import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await prisma.reconciliationSession.findUnique({
      where: { id: params.id },
      include: {
        createdBy: { select: { id: true, name: true } },
        items: {
          include: {
            item: { select: { id: true, name: true, sku: true, unit: true } },
            location: { select: { id: true, code: true, name: true } },
            checkedBy: { select: { id: true, name: true } },
            approvedBy: { select: { id: true, name: true } },
          },
          orderBy: { location: { code: "asc" } },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "실사 세션을 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}

// Complete reconciliation session
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();

    if (body.action === "complete") {
      // Apply all approved adjustments
      const approvedItems = await prisma.reconciliationItem.findMany({
        where: { sessionId: params.id, status: "APPROVED" },
      });

      for (const item of approvedItems) {
        if (item.actualQty !== null && item.difference !== null && item.difference !== 0) {
          await prisma.inventoryStock.updateMany({
            where: { itemId: item.itemId, locationId: item.locationId },
            data: { quantity: item.actualQty },
          });
        }
      }

      await prisma.reconciliationSession.update({
        where: { id: params.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}
