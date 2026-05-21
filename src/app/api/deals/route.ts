import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError, paginate, createPaginatedResponse } from "@/lib/utils";
import { createDealSchema } from "@/validations/deal";
import { DEFAULT_PAGE_SIZE } from "@/constants";
type DealStatus = string;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE)));
    const status = searchParams.get("status") as DealStatus | null;
    const agentId = searchParams.get("agentId");
    const search = searchParams.get("search") || "";

    const userId = request.headers.get("x-user-id")!;
    const userRole = request.headers.get("x-user-role")!;

    const where: Record<string, unknown> = { deletedAt: null };
    if (userRole === "AGENT") where.agentId = userId;
    else if (agentId) where.agentId = agentId;
    if (status) where.status = status;
    if (search) where.title = { contains: search, mode: "insensitive" };

    const { skip, take } = paginate(page, limit);
    const [deals, total] = await Promise.all([
      db.deal.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          lead: { select: { id: true, fullName: true, phone: true } },
          customer: { select: { id: true, name: true, phone: true } },
          property: { select: { id: true, title: true, city: true } },
          agent: { select: { id: true, name: true, avatar: true } },
          payments: true,
        },
      }),
      db.deal.count({ where }),
    ]);

    return apiSuccess(createPaginatedResponse(deals, total, page, limit));
  } catch (error) {
    console.error("[DEALS_GET]", error);
    return apiError("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createDealSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 400, parsed.error.flatten());

    const userId = request.headers.get("x-user-id")!;
    const userRole = request.headers.get("x-user-role")!;
    const data = parsed.data;
    if (userRole === "AGENT" && !data.agentId) data.agentId = userId;

    const commissionAmount = (data.finalAmount * (data.commissionRate || 2)) / 100;

    const deal = await db.deal.create({
      data: { ...data, commissionAmount },
      include: {
        lead: { select: { id: true, fullName: true } },
        customer: { select: { id: true, name: true } },
        property: { select: { id: true, title: true } },
      },
    });

    return apiSuccess(deal, "Deal created", 201);
  } catch (error) {
    console.error("[DEALS_POST]", error);
    return apiError("Internal server error", 500);
  }
}
