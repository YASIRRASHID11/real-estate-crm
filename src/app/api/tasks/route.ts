import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError, paginate, createPaginatedResponse } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import { z } from "zod";

const createTaskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  status: z.enum(["PENDING","IN_PROGRESS","COMPLETED","OVERDUE","CANCELLED"]).default("PENDING"),
  priority: z.enum(["LOW","MEDIUM","HIGH","URGENT"]).default("MEDIUM"),
  dueDate: z.string().optional(),
  assignedToId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE)));
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const userId = request.headers.get("x-user-id")!;
    const userRole = request.headers.get("x-user-role")!;

    const where: Record<string, unknown> = {};
    if (userRole === "AGENT") where.assignedToId = userId;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const { skip, take } = paginate(page, limit);
    const [tasks, total] = await Promise.all([
      db.task.findMany({
        where, skip, take, orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        include: {
          assignedTo: { select: { id: true, name: true, avatar: true } },
          lead: { select: { id: true, fullName: true } },
          deal: { select: { id: true, title: true } },
        },
      }),
      db.task.count({ where }),
    ]);

    return apiSuccess(createPaginatedResponse(tasks, total, page, limit));
  } catch (error) {
    console.error("[TASKS_GET]", error);
    return apiError("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 400, parsed.error.flatten());

    const userId = request.headers.get("x-user-id")!;
    const { dueDate, ...rest } = parsed.data;

    const task = await db.task.create({
      data: { ...rest, createdById: userId, dueDate: dueDate ? new Date(dueDate) : undefined },
      include: { assignedTo: { select: { id: true, name: true } } },
    });
    return apiSuccess(task, "Task created", 201);
  } catch (error) {
    console.error("[TASKS_POST]", error);
    return apiError("Internal server error", 500);
  }
}
