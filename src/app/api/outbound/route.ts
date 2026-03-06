import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type") || "";

    const where: Record<string, unknown> = {};
    if (type) where.type = type;

    const [records, total] = await Promise.all([
      prisma.outboundRecord.findMany({
        where,
        include: {
          item: { select: { id: true, name: true, sku: true, unit: true } },
          location: { select: { id: true, code: true, name: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.outboundRecord.count({ where }),
    ]);

    return NextResponse.json({ records, total, page, limit });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 });
  }
}
