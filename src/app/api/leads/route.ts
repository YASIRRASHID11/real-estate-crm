import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError, paginate, createPaginatedResponse } from "@/lib/utils";
import { createLeadSchema } from "@/validations/lead";
import { DEFAULT_PAGE_SIZE } from "@/constants";
type LeadStatus = string;
type LeadSource = string;
type PropertyType = string;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE)));
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") as LeadStatus | null;
    const source = searchParams.get("source") as LeadSource | null;
    const agentId = searchParams.get("agentId");
    const propertyType = searchParams.get("propertyType") as PropertyType | null;

    const userId = request.headers.get("x-user-id")!;
    const userRole = request.headers.get("x-user-role")!;

    const where: Record<string, unknown> = { deletedAt: null };

    // Agents can only see their own leads
    if (userRole === "AGENT") where.agentId = userId;
    else if (agentId) where.agentId = agentId;

    if (status) where.status = status;
    if (source) where.source = source;
    if (propertyType) where.propertyType = propertyType;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    const { skip, take } = paginate(page, limit);
    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          assignedAgent: { select: { id: true, name: true, email: true, avatar: true } },
          _count: { select: { activities: true, followUps: true } },
        },
      }),
      db.lead.count({ where }),
    ]);

    return apiSuccess(createPaginatedResponse(leads, total, page, limit));
  } catch (error) {
    console.error("[LEADS_GET]", error);
    return apiError("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createLeadSchema.safeParse(body);

    if (!parsed.success) return apiError("Validation failed", 400, parsed.error.flatten());

    const userId = request.headers.get("x-user-id")!;
    const userRole = request.headers.get("x-user-role")!;

    const data = parsed.data;
    // Auto-assign to self if agent
    if (userRole === "AGENT" && !data.agentId) data.agentId = userId;

    const { tags, followUpDate, ...rest } = data;
    const lead = await db.lead.create({
      data: {
        ...rest,
        email: rest.email || undefined,
        tags: JSON.stringify(tags || []),
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      },
      include: {
        assignedAgent: { select: { id: true, name: true, email: true } },
      },
    });

    // Log activity
    await db.leadActivity.create({
      data: { leadId: lead.id, userId, action: "CREATED", description: "Lead created" },
    });

    return apiSuccess(lead, "Lead created", 201);
  } catch (error) {
    console.error("[LEADS_POST]", error);
    return apiError("Internal server error", 500);
  }
}
