import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess } from "@/lib/utils";
import { verifyAccessToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("access_token")?.value;
    if (token) {
      const payload = verifyAccessToken(token);
      await db.user.update({
        where: { id: payload.userId },
        data: { refreshToken: null },
      }).catch(() => {});
    }
  } catch {}

  const response = apiSuccess(null, "Logged out successfully");
  response.headers.append("Set-Cookie", "access_token=; HttpOnly; Path=/; Max-Age=0");
  response.headers.append("Set-Cookie", "refresh_token=; HttpOnly; Path=/; Max-Age=0");
  return response;
}
