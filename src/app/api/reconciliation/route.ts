import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const sessions = await prisma.reconciliationSession.findMany({
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { startedAt: "desc" },
    });

    // Add progress info
    const sessionsWithProgress = await Promise.all(
      sessions.map(async (s) => {
        const checked = await prisma.reconciliationItem.count({
          where: { sessionId: s.id, status: { not: "PENDING" } },
        });
        return {
          ...s,
          checkedCount: checked,
          totalCount: s._count.items,
          progress: s._count.items > 0 ? Math.round((checked / s._count.items) * 100) : 0,
        };
      })
    );

    return NextResponse.json(sessionsWithProgress);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const yearMonth = body.yearMonth; // "2026-03"

    // Check if session already exists
    const existing = await prisma.reconciliationSession.findUnique({
      where: { yearMonth },
    });
    if (existing) {
      return NextResponse.json({ error: "해당 월의 실사 세션이 이미 존재합니다." }, { status: 400 });
    }

    // Get all inventory stocks
    const stocks = await prisma.inventoryStock.findMany({
      where: { quantity: { gt: 0 } },
      include: {
        item: { select: { id: true, name: true } },
        location: { select: { id: true, code: true } },
      },
    });

    const reconciliationSession = await prisma.reconciliationSession.create({
      data: {
        yearMonth,
        createdById: session.user.id,
        notes: body.notes || null,
        items: {
          create: stocks.map((stock) => ({
            itemId: stock.itemId,
            locationId: stock.locationId,
            systemQty: stock.quantity,
          })),
        },
      },
      include: {
        _count: { select: { items: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "ReconciliationSession",
        entityId: reconciliationSession.id,
        newValue: { yearMonth, itemCount: stocks.length },
      },
    });

    return NextResponse.json(reconciliationSession, { status: 201 });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
