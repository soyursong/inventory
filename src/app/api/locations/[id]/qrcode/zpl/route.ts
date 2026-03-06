import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateZPLLabel, sendToLabelPrinter } from "@/lib/qrcode";

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

    // Get printer settings
    const printerSettings = await prisma.systemSetting.findUnique({
      where: { key: "label_printer" },
    });

    const settings = (printerSettings?.value as Record<string, unknown>) || {};
    const labelWidth = (settings.labelWidth as number) || 60;
    const labelHeight = (settings.labelHeight as number) || 40;

    const zpl = generateZPLLabel({
      locationCode: location.code,
      locationName: location.name,
      qrData,
      labelWidth,
      labelHeight,
    });

    return new NextResponse(zpl, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `inline; filename="label-${location.code}.zpl"`,
      },
    });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to generate ZPL" }, { status: 500 });
  }
}

// POST: 라벨 프린터에 직접 인쇄
export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const location = await prisma.storageLocation.findUnique({
      where: { id: params.id },
    });

    if (!location) {
      return NextResponse.json({ error: "위치를 찾을 수 없습니다." }, { status: 404 });
    }

    const printerSettings = await prisma.systemSetting.findUnique({
      where: { key: "label_printer" },
    });

    const settings = (printerSettings?.value as Record<string, unknown>) || {};
    const printerIp = settings.ip as string;
    const printerPort = (settings.port as number) || 9100;

    if (!printerIp) {
      return NextResponse.json({ error: "라벨 프린터가 설정되지 않았습니다." }, { status: 400 });
    }

    const qrData = JSON.stringify({
      type: "location",
      id: location.id,
      code: location.code,
    });

    const zpl = generateZPLLabel({
      locationCode: location.code,
      locationName: location.name,
      qrData,
      labelWidth: (settings.labelWidth as number) || 60,
      labelHeight: (settings.labelHeight as number) || 40,
    });

    const result = await sendToLabelPrinter(zpl, printerIp, printerPort);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "인쇄 실패" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "라벨이 인쇄되었습니다." });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to print label" }, { status: 500 });
  }
}
