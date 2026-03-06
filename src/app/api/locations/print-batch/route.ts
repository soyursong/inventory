import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQRCodeDataURL } from "@/lib/qrcode";

export async function POST(request: NextRequest) {
  try {
    const { locationIds } = await request.json();

    if (!locationIds || locationIds.length === 0) {
      return NextResponse.json({ error: "위치를 선택해주세요." }, { status: 400 });
    }

    const locations = await prisma.storageLocation.findMany({
      where: { id: { in: locationIds } },
      orderBy: { code: "asc" },
    });

    const labels = await Promise.all(
      locations.map(async (loc) => {
        const qrData = JSON.stringify({
          type: "location",
          id: loc.id,
          code: loc.code,
        });
        const qrDataUrl = await generateQRCodeDataURL(qrData);
        return {
          code: loc.code,
          name: loc.name,
          floor: loc.floor,
          zone: loc.zone,
          shelf: loc.shelf,
          qrDataUrl,
        };
      })
    );

    return NextResponse.json({ labels });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to generate labels" }, { status: 500 });
  }
}
