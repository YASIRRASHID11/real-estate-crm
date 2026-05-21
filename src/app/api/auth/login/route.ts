import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { comparePassword, signAccessToken, signRefreshToken } from "@/lib/auth";
import { loginSchema } from "@/validations/auth";
import { apiSuccess, apiError } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const { email, password } = parsed.data;

    const user = await db.user.findUnique({
      where: { email, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        password: true,
        avatar: true,
      },
    });

    if (!user) return apiError("Invalid credentials", 401);
    if (user.status !== "ACTIVE") return apiError("Account suspended or inactive", 403);

    const isValid = await comparePassword(password, user.password);
    if (!isValid) return apiError("Invalid credentials", 401);

    const payload = { userId: user.id, email: user.email, role: user.role, name: user.name };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Save refresh token
    await db.user.update({
      where: { id: user.id },
      data: { refreshToken, lastLogin: new Date() },
    });

    const response = apiSuccess(
      { user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }, accessToken },
      "Login successful"
    );

    response.headers.append("Set-Cookie", `access_token=${accessToken}; HttpOnly; Path=/; Max-Age=900; SameSite=Strict`);
    response.headers.append("Set-Cookie", `refresh_token=${refreshToken}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict`);

    return response;
  } catch (error) {
    console.error("[LOGIN]", error);
    return apiError("Internal server error", 500);
  }
}
