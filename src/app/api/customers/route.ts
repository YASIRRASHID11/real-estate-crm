import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError, paginate, createPaginatedResponse } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import { z } from "zod";

const createCustomerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  customerType: z.enum(["BUYER","SELLER","INVESTOR","TENANT"]).default("BUYER"),
  budget: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
  preferredArea: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE)));
    const search = searchParams.get("search") || "";
    const customerType = searchParams.get("customerType");

    const where: Record<string, unknown> = { deletedAt: null };
    if (customerType) where.customerType = customerType;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const { skip, take } = paginate(page, limit);
    const [customers, total] = await Promise.all([
      db.customer.findMany({
        where, skip, take, orderBy: { createdAt: "desc" },
        include: { _count: { select: { deals: true, leads: true } } },
      }),
      db.customer.count({ where }),
    ]);

    return apiSuccess(createPaginatedResponse(customers, total, page, limit));
  } catch (error) {
    console.error("[CUSTOMERS_GET]", error);
    return apiError("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createCustomerSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 400, parsed.error.flatten());

    const customer = await db.customer.create({
      data: { ...parsed.data, email: parsed.data.email || undefined },
    });
    return apiSuccess(customer, "Customer created", 201);
  } catch (error) {
    console.error("[CUSTOMERS_POST]", error);
    return apiError("Internal server error", 500);
  }
}
