import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQRCodeBuffer } from "@/lib/qrcode";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const location = await prisma.storageLocation.findUnique({
      where: { id: params.id },
    });

    if (!location) {
      return NextResponse.json({ error: "위치를 찾을 수 없습니다." }, { status: 404 });
    }

    const qrData = JSON.stringify({
      type: "location",
      id: location.id,
      code: location.code,
    });

    const buffer = await generateQRCodeBuffer(qrData);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="qr-${location.code}.png"`,
      },
    });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 });
  }
}
