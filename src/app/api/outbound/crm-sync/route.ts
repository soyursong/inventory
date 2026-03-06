import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { crmClient } from "@/lib/crm-client";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const { fromDate, toDate } = body;

    // Fetch consumption data from CRM
    const result = await crmClient.fetchConsumption(fromDate, toDate);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "CRM 동기화 실패" }, { status: 500 });
    }

    const syncResults = {
      total: result.data.length,
      synced: 0,
      skipped: 0,
      errors: [] as string[],
      lowStockAlerts: [] as string[],
    };

    for (const consumption of result.data) {
      // Check if already synced
      const existing = await prisma.outboundRecord.findFirst({
        where: { crmReferenceId: consumption.crmReferenceId },
      });

      if (existing) {
        syncResults.skipped++;
        continue;
      }

      // Find item by SKU
      const item = await prisma.item.findUnique({
        where: { sku: consumption.itemSku },
      });

      if (!item) {
        syncResults.errors.push(`품목을 찾을 수 없음: ${consumption.itemSku}`);
        continue;
      }

      // Find stock to deduct from (FIFO by oldest lot)
      const stocks = await prisma.inventoryStock.findMany({
        where: { itemId: item.id, quantity: { gt: 0 } },
        orderBy: { expiryDate: "asc" },
      });

      let remainingQty = consumption.quantity;

      for (const stock of stocks) {
        if (remainingQty <= 0) break;

        const deductQty = Math.min(stock.quantity, remainingQty);
        await prisma.inventoryStock.update({
          where: { id: stock.id },
          data: { quantity: { decrement: deductQty } },
        });
        remainingQty -= deductQty;
      }

      // Create outbound record
      await prisma.outboundRecord.create({
        data: {
          itemId: item.id,
          locationId: stocks[0]?.locationId || null,
          quantity: consumption.quantity,
          crmReferenceId: consumption.crmReferenceId,
          crmSyncedAt: new Date(),
          type: "CRM_SYNC",
          notes: `시술: ${consumption.procedureType || "N/A"}`,
        },
      });

      syncResults.synced++;

      // Check safety stock
      const totalStock = await prisma.inventoryStock.aggregate({
        where: { itemId: item.id },
        _sum: { quantity: true },
      });

      if ((totalStock._sum.quantity || 0) < item.safetyStock) {
        syncResults.lowStockAlerts.push(`${item.name} (현재: ${totalStock._sum.quantity || 0}, 안전재고: ${item.safetyStock})`);
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "SYNC",
        entityType: "OutboundRecord",
        entityId: "crm-sync",
        newValue: syncResults,
      },
    });

    return NextResponse.json(syncResults);
  } catch (_error) {
    return NextResponse.json({ error: "CRM 동기화에 실패했습니다." }, { status: 500 });
  }
}
