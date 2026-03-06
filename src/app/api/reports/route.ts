import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "stock-summary";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";

    switch (type) {
      case "stock-summary": {
        const stocks = await prisma.inventoryStock.findMany({
          where: { quantity: { gt: 0 } },
          include: {
            item: { select: { name: true, sku: true, unit: true, safetyStock: true, category: { select: { name: true } } } },
            location: { select: { code: true, name: true } },
          },
          orderBy: { item: { name: "asc" } },
        });
        return NextResponse.json({ type, data: stocks });
      }

      case "inbound-history": {
        const where: Record<string, unknown> = {};
        if (from && to) {
          where.createdAt = { gte: new Date(from), lte: new Date(to) };
        }
        const orders = await prisma.inboundOrder.findMany({
          where,
          include: {
            supplier: { select: { name: true } },
            items: { include: { item: { select: { name: true, sku: true } } } },
          },
          orderBy: { createdAt: "desc" },
        });
        return NextResponse.json({ type, data: orders });
      }

      case "outbound-history": {
        const where: Record<string, unknown> = {};
        if (from && to) {
          where.createdAt = { gte: new Date(from), lte: new Date(to) };
        }
        const records = await prisma.outboundRecord.findMany({
          where,
          include: {
            item: { select: { name: true, sku: true, unit: true } },
            location: { select: { code: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        });
        return NextResponse.json({ type, data: records });
      }

      case "reconciliation-result": {
        const sessions = await prisma.reconciliationSession.findMany({
          include: {
            items: {
              where: { status: { not: "PENDING" } },
              include: {
                item: { select: { name: true, sku: true } },
                location: { select: { code: true } },
              },
            },
            createdBy: { select: { name: true } },
          },
          orderBy: { startedAt: "desc" },
          take: 12,
        });
        return NextResponse.json({ type, data: sessions });
      }

      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }
  } catch (_error) {
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
