import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, signAccessToken, signRefreshToken, type JWTPayload } from "@/lib/auth";
import { registerSchema } from "@/validations/auth";
import { apiSuccess, apiError } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const callerRole = request.headers.get("x-user-role");
    const callerEmail = request.headers.get("x-user-email");
    if (callerRole !== "ADMIN" || callerEmail !== "Embrace@gmail.com") {
      return apiError("Unauthorized", 403);
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const { name, email, password, phone, role } = parsed.data;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return apiError("Email already registered", 409);

    const hashedPassword = await hashPassword(password);

    const user = await db.user.create({
      data: { name, email, password: hashedPassword, phone, role: role || "AGENT" },
      select: { id: true, name: true, email: true, role: true, avatar: true },
    });

    const payload: JWTPayload = { userId: user.id, email: user.email, role: user.role as JWTPayload["role"], name: user.name };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await db.user.update({ where: { id: user.id }, data: { refreshToken } });

    const response = apiSuccess(
      { user, accessToken },
      "Registration successful",
      201
    );

    response.headers.append("Set-Cookie", `access_token=${accessToken}; HttpOnly; Path=/; Max-Age=900; SameSite=Strict`);
    response.headers.append("Set-Cookie", `refresh_token=${refreshToken}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict`);

    return response;
  } catch (error) {
    console.error("[REGISTER]", error);
    return apiError("Internal server error", 500);
  }
}
