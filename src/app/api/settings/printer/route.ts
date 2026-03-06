import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "label_printer" },
    });
    return NextResponse.json(setting?.value || { ip: "", port: 9100, labelWidth: 60, labelHeight: 40 });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const setting = await prisma.systemSetting.upsert({
      where: { key: "label_printer" },
      update: { value: body },
      create: { key: "label_printer", value: body },
    });
    return NextResponse.json(setting.value);
  } catch (_error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
