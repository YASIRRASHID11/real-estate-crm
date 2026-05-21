import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refresh_token")?.value;
    if (!refreshToken) return apiError("No refresh token", 401);

    const payload = verifyRefreshToken(refreshToken);

    const user = await db.user.findUnique({
      where: { id: payload.userId, refreshToken, deletedAt: null },
      select: { id: true, email: true, name: true, role: true, status: true },
    });

    if (!user || user.status !== "ACTIVE") return apiError("Invalid session", 401);

    const newPayload = { userId: user.id, email: user.email, role: user.role, name: user.name };
    const newAccessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);

    await db.user.update({ where: { id: user.id }, data: { refreshToken: newRefreshToken } });

    const response = apiSuccess({ accessToken: newAccessToken }, "Token refreshed");
    response.headers.append("Set-Cookie", `access_token=${newAccessToken}; HttpOnly; Path=/; Max-Age=900; SameSite=Strict`);
    response.headers.append("Set-Cookie", `refresh_token=${newRefreshToken}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict`);
    return response;
  } catch {
    return apiError("Invalid refresh token", 401);
  }
}
