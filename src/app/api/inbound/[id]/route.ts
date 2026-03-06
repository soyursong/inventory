import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const order = await prisma.inboundOrder.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        createdBy: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            item: { select: { id: true, name: true, sku: true, unit: true } },
            inspections: {
              include: { inspector: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });

    if (!order) return NextResponse.json({ error: "입고를 찾을 수 없습니다." }, { status: 404 });
    return NextResponse.json(order);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}
