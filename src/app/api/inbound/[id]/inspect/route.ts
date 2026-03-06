import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    // body.inspections: [{ inboundOrderItemId, status, inspectedQty, passedQty, failedQty, failReason, locationId }]

    const order = await prisma.inboundOrder.findUnique({
      where: { id: params.id },
      include: { items: true },
    });

    if (!order) return NextResponse.json({ error: "입고를 찾을 수 없습니다." }, { status: 404 });

    // Update order status to INSPECTING
    await prisma.inboundOrder.update({
      where: { id: params.id },
      data: { status: "INSPECTING" },
    });

    let allPassed = true;
    let anyFailed = false;

    for (const inspection of body.inspections) {
      // Create inspection record
      await prisma.inspectionRecord.create({
        data: {
          inboundOrderItemId: inspection.inboundOrderItemId,
          inspectorId: session.user.id,
          status: inspection.status, // PASS, FAIL, PARTIAL
          inspectedQty: inspection.inspectedQty,
          passedQty: inspection.passedQty,
          failedQty: inspection.failedQty || 0,
          failReason: inspection.failReason || null,
          notes: inspection.notes || null,
        },
      });

      // Update inbound order item status
      const itemStatus = inspection.status === "PASS" ? "PASSED" :
                         inspection.status === "FAIL" ? "FAILED" : "PARTIAL";

      await prisma.inboundOrderItem.update({
        where: { id: inspection.inboundOrderItemId },
        data: {
          status: itemStatus,
          receivedQty: inspection.passedQty,
        },
      });

      if (inspection.status !== "PASS") allPassed = false;
      if (inspection.status === "FAIL") anyFailed = true;

      // If passed or partial, add to inventory
      if (inspection.passedQty > 0 && inspection.locationId) {
        const orderItem = order.items.find(i => i.id === inspection.inboundOrderItemId);
        if (orderItem) {
          await prisma.inventoryStock.upsert({
            where: {
              itemId_locationId_lotNumber: {
                itemId: orderItem.itemId,
                locationId: inspection.locationId,
                lotNumber: orderItem.lotNumber || "",
              },
            },
            update: {
              quantity: { increment: inspection.passedQty },
              expiryDate: orderItem.expiryDate,
            },
            create: {
              itemId: orderItem.itemId,
              locationId: inspection.locationId,
              quantity: inspection.passedQty,
              lotNumber: orderItem.lotNumber || null,
              expiryDate: orderItem.expiryDate,
            },
          });
        }
      }
    }

    // Update order status
    const finalStatus = allPassed ? "COMPLETED" : anyFailed ? "REJECTED" : "COMPLETED";
    await prisma.inboundOrder.update({
      where: { id: params.id },
      data: {
        status: finalStatus,
        receivedDate: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "INSPECT",
        entityType: "InboundOrder",
        entityId: params.id,
        newValue: { status: finalStatus, inspections: body.inspections.length },
      },
    });

    return NextResponse.json({ success: true, status: finalStatus });
  } catch (_error) {
    console.error("Inspection error:", _error);
    return NextResponse.json({ error: "검수 처리에 실패했습니다." }, { status: 500 });
  }
}
