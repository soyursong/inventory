import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = { active: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          inventoryStocks: { select: { quantity: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.item.count({ where }),
    ]);

    const itemsWithStock = items.map((item) => ({
      ...item,
      totalStock: item.inventoryStocks.reduce((sum, s) => sum + s.quantity, 0),
    }));

    return NextResponse.json({ items: itemsWithStock, total, page, limit });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const item = await prisma.item.create({
      data: {
        name: body.name,
        sku: body.sku,
        categoryId: body.categoryId || null,
        unit: body.unit || "EA",
        description: body.description || null,
        manufacturer: body.manufacturer || null,
        safetyStock: body.safetyStock || 0,
        expiryManaged: body.expiryManaged || false,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create item";
    if (message.includes("Unique constraint")) {
      return NextResponse.json({ error: "이미 존재하는 SKU입니다." }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
