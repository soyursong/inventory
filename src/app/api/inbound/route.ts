import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.inboundOrder.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.inboundOrder.count({ where }),
    ]);

    return NextResponse.json({ orders, total, page, limit });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();

    const order = await prisma.inboundOrder.create({
      data: {
        orderNumber: generateOrderNumber(),
        supplierId: body.supplierId,
        expectedDate: body.expectedDate ? new Date(body.expectedDate) : null,
        createdById: session.user.id,
        notes: body.notes || null,
        items: {
          create: body.items.map((item: { itemId: string; expectedQty: number; locationId?: string; lotNumber?: string; expiryDate?: string }) => ({
            itemId: item.itemId,
            expectedQty: item.expectedQty,
            locationId: item.locationId || null,
            lotNumber: item.lotNumber || null,
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
          })),
        },
      },
      include: {
        items: { include: { item: true } },
        supplier: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entityType: "InboundOrder",
        entityId: order.id,
        newValue: { orderNumber: order.orderNumber },
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
