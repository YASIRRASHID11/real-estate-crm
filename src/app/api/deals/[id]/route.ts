import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/utils";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;

    const deal = await db.deal.findUnique({ where: { id } });
    if (!deal || deal.deletedAt) return apiError("Deal not found", 404);

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    // When marking as CLOSED, set closedAt timestamp
    if (status === "CLOSED") updateData.closedAt = new Date();

    const updated = await db.deal.update({
      where: { id },
      data: updateData,
      include: {
        lead: { select: { id: true, fullName: true } },
        customer: { select: { id: true, name: true } },
        property: { select: { id: true, title: true } },
        agent: { select: { id: true, name: true } },
      },
    });

    return apiSuccess(updated, status === "CLOSED" ? "Deal marked as closed" : "Deal updated");
  } catch (error) {
    console.error("[DEAL_PATCH]", error);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const deal = await db.deal.findUnique({ where: { id } });
    if (!deal || deal.deletedAt) return apiError("Deal not found", 404);

    await db.deal.update({ where: { id }, data: { deletedAt: new Date() } });
    return apiSuccess(null, "Deal deleted");
  } catch (error) {
    console.error("[DEAL_DELETE]", error);
    return apiError("Internal server error", 500);
  }
}
