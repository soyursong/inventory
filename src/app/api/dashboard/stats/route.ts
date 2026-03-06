import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [totalItems, pendingInbound, todayStart] = await Promise.all([
      prisma.item.count({ where: { active: true } }),
      prisma.inboundOrder.count({ where: { status: "PENDING" } }),
      Promise.resolve(new Date(new Date().setHours(0, 0, 0, 0))),
    ]);

    const stocks = await prisma.inventoryStock.aggregate({
      _sum: { quantity: true },
    });

    const todayOutbound = await prisma.outboundRecord.aggregate({
      where: { createdAt: { gte: todayStart } },
      _sum: { quantity: true },
    });

    // Low stock items
    const items = await prisma.item.findMany({
      where: { active: true, safetyStock: { gt: 0 } },
      include: {
        inventoryStocks: {
          select: { quantity: true },
        },
      },
    });

    const lowStockAlerts = items
      .map((item) => {
        const totalQuantity = item.inventoryStocks.reduce((sum, s) => sum + s.quantity, 0);
        return { ...item, totalQuantity };
      })
      .filter((item) => item.totalQuantity < item.safetyStock)
      .slice(0, 10)
      .map((item) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        totalQuantity: item.totalQuantity,
        safetyStock: item.safetyStock,
      }));

    const recentActivity = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    });

    const activeReconciliation = await prisma.reconciliationSession.findFirst({
      where: { status: "IN_PROGRESS" },
    });

    return NextResponse.json({
      totalItems,
      totalStock: stocks._sum.quantity || 0,
      lowStockItems: lowStockAlerts.length,
      pendingInbound,
      todayOutbound: todayOutbound._sum.quantity || 0,
      activeReconciliation: !!activeReconciliation,
      recentActivity,
      lowStockAlerts,
    });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
