import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError, paginate, createPaginatedResponse } from "@/lib/utils";
import { hashPassword } from "@/lib/auth";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  role: z.enum(["SUPER_ADMIN","ADMIN","SALES_MANAGER","AGENT","ACCOUNTANT"]).default("AGENT"),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE)));
    const role = searchParams.get("role");
    const search = searchParams.get("search") || "";

    const userRole = request.headers.get("x-user-role")!;
    if (!["SUPER_ADMIN", "ADMIN"].includes(userRole)) return apiError("Unauthorized", 403);

    const where: Record<string, unknown> = { deletedAt: null };
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const { skip, take } = paginate(page, limit);
    const [users, total] = await Promise.all([
      db.user.findMany({
        where, skip, take, orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, email: true, phone: true, role: true,
          status: true, avatar: true, lastLogin: true, createdAt: true,
          _count: { select: { assignedLeads: true, assignedDeals: true } },
        },
      }),
      db.user.count({ where }),
    ]);

    return apiSuccess(createPaginatedResponse(users, total, page, limit));
  } catch (error) {
    console.error("[USERS_GET]", error);
    return apiError("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role")!;
    if (!["SUPER_ADMIN", "ADMIN"].includes(userRole)) return apiError("Unauthorized", 403);

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 400, parsed.error.flatten());

    const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) return apiError("Email already registered", 409);

    const hashedPassword = await hashPassword(parsed.data.password);
    const user = await db.user.create({
      data: { ...parsed.data, password: hashedPassword },
      select: { id: true, name: true, email: true, role: true, status: true },
    });

    return apiSuccess(user, "User created", 201);
  } catch (error) {
    console.error("[USERS_POST]", error);
    return apiError("Internal server error", 500);
  }
}
