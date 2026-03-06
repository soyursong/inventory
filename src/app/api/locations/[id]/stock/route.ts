import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const location = await prisma.storageLocation.findUnique({
      where: { id: params.id },
      include: {
        inventoryStocks: {
          where: { quantity: { gt: 0 } },
          include: {
            item: {
              select: { id: true, name: true, sku: true, unit: true, safetyStock: true, expiryManaged: true },
            },
          },
          orderBy: { item: { name: "asc" } },
        },
      },
    });

    if (!location) {
      return NextResponse.json({ error: "위치를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json(location);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch stock" }, { status: 500 });
  }
}
