import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/utils";
import { updateLeadSchema } from "@/validations/lead";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const lead = await db.lead.findUnique({
      where: { id, deletedAt: null },
      include: {
        assignedAgent: { select: { id: true, name: true, email: true, avatar: true } },
        activities: { orderBy: { createdAt: "desc" }, take: 20, include: { user: { select: { name: true, avatar: true } } } },
        followUps: { orderBy: { scheduledAt: "asc" } },
        notesList: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true, avatar: true } } } },
      },
    });
    if (!lead) return apiError("Lead not found", 404);
    return apiSuccess(lead);
  } catch (error) {
    console.error("[LEAD_GET]", error);
    return apiError("Internal server error", 500);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateLeadSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 400, parsed.error.flatten());

    const userId = request.headers.get("x-user-id")!;
    const existing = await db.lead.findUnique({ where: { id, deletedAt: null } });
    if (!existing) return apiError("Lead not found", 404);

    const { followUpDate, ...rest } = parsed.data;
    const lead = await db.lead.update({
      where: { id },
      data: {
        ...rest,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      },
    });

    await db.leadActivity.create({
      data: { leadId: id, userId, action: "UPDATED", description: "Lead updated" },
    });

    return apiSuccess(lead, "Lead updated");
  } catch (error) {
    console.error("[LEAD_PATCH]", error);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const role = _.headers.get("x-user-role");
    if (role === "AGENT") return apiError("Unauthorized", 403);

    await db.lead.update({ where: { id }, data: { deletedAt: new Date() } });
    return apiSuccess(null, "Lead deleted");
  } catch (error) {
    console.error("[LEAD_DELETE]", error);
    return apiError("Internal server error", 500);
  }
}
