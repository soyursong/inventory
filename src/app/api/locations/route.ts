import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = { active: true };
    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    const locations = await prisma.storageLocation.findMany({
      where,
      include: {
        _count: { select: { inventoryStocks: true } },
      },
      orderBy: { code: "asc" },
    });
    return NextResponse.json(locations);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = `${body.floor}-${body.zone}-${body.shelf}`;

    const location = await prisma.storageLocation.create({
      data: {
        code,
        name: body.name,
        floor: body.floor,
        zone: body.zone,
        shelf: body.shelf,
        description: body.description || null,
        qrCodeData: JSON.stringify({ type: "location", code }),
      },
    });
    return NextResponse.json(location, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed";
    if (message.includes("Unique constraint")) {
      return NextResponse.json({ error: "이미 존재하는 위치 코드입니다." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create location" }, { status: 500 });
  }
}
