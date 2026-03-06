import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const item = await prisma.item.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        inventoryStocks: {
          include: { location: { select: { id: true, code: true, name: true } } },
        },
      },
    });
    if (!item) return NextResponse.json({ error: "품목을 찾을 수 없습니다." }, { status: 404 });
    return NextResponse.json(item);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const item = await prisma.item.update({
      where: { id: params.id },
      data: {
        name: body.name,
        sku: body.sku,
        categoryId: body.categoryId || null,
        unit: body.unit,
        description: body.description,
        manufacturer: body.manufacturer,
        safetyStock: body.safetyStock,
        expiryManaged: body.expiryManaged,
      },
    });
    return NextResponse.json(item);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.item.update({
      where: { id: params.id },
      data: { active: false },
    });
    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
