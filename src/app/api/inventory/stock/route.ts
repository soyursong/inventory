import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const locationId = searchParams.get("locationId") || "";

    const where: Record<string, unknown> = { quantity: { gt: 0 } };
    if (locationId) where.locationId = locationId;
    if (search) {
      where.item = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const stocks = await prisma.inventoryStock.findMany({
      where,
      include: {
        item: { select: { id: true, name: true, sku: true, unit: true, safetyStock: true, expiryManaged: true } },
        location: { select: { id: true, code: true, name: true } },
      },
      orderBy: { item: { name: "asc" } },
    });

    return NextResponse.json(stocks);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch stock" }, { status: 500 });
  }
}
