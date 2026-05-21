import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/utils";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.enum(["PENDING","IN_PROGRESS","COMPLETED","OVERDUE","CANCELLED"]).optional(),
  priority: z.enum(["LOW","MEDIUM","HIGH","URGENT"]).optional(),
  dueDate: z.string().optional(),
  completedAt: z.string().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 400, parsed.error.flatten());

    const { dueDate, completedAt, ...rest } = parsed.data;
    const task = await db.task.update({
      where: { id },
      data: {
        ...rest,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        completedAt: completedAt ? new Date(completedAt) : undefined,
      },
    });
    return apiSuccess(task, "Task updated");
  } catch (error) {
    console.error("[TASK_PATCH]", error);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.task.delete({ where: { id } });
    return apiSuccess(null, "Task deleted");
  } catch (error) {
    console.error("[TASK_DELETE]", error);
    return apiError("Internal server error", 500);
  }
}
