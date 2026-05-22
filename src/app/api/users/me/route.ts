import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, comparePassword } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")!;
    const body = await request.json();

    if (body.currentPassword) {
      const parsed = updatePasswordSchema.safeParse(body);
      if (!parsed.success) return apiError("Validation failed", 400, parsed.error.flatten());

      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user) return apiError("User not found", 404);

      const valid = await comparePassword(parsed.data.currentPassword, user.password);
      if (!valid) return apiError("Current password is incorrect", 400);

      const hashed = await hashPassword(parsed.data.newPassword);
      await db.user.update({ where: { id: userId }, data: { password: hashed } });
      return apiSuccess(null, "Password updated successfully");
    }

    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 400, parsed.error.flatten());

    const user = await db.user.update({
      where: { id: userId },
      data: parsed.data,
      select: { id: true, name: true, email: true, role: true, avatar: true, phone: true },
    });

    return apiSuccess(user, "Profile updated successfully");
  } catch (error) {
    console.error("[PROFILE_PATCH]", error);
    return apiError("Internal server error", 500);
  }
}
