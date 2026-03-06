import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, locationId, newQuantity, reason } = body;

    const stock = await prisma.inventoryStock.findFirst({
      where: { itemId, locationId },
    });

    const oldQuantity = stock?.quantity || 0;

    if (stock) {
      await prisma.inventoryStock.update({
        where: { id: stock.id },
        data: { quantity: newQuantity },
      });
    } else {
      await prisma.inventoryStock.create({
        data: { itemId, locationId, quantity: newQuantity },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ADJUST",
        entityType: "InventoryStock",
        entityId: stock?.id || "new",
        oldValue: { quantity: oldQuantity },
        newValue: { quantity: newQuantity, reason },
      },
    });

    return NextResponse.json({ success: true, oldQuantity, newQuantity });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to adjust stock" }, { status: 500 });
  }
}
