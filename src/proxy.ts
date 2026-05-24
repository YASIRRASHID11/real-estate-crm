import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, verifyRefreshToken, signAccessToken } from "@/lib/auth";

const publicPaths = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/seed",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  // Try access token first
  if (accessToken) {
    try {
      const payload = verifyAccessToken(accessToken);
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-user-id", payload.userId);
      requestHeaders.set("x-user-role", payload.role);
      requestHeaders.set("x-user-email", payload.email);
      requestHeaders.set("x-user-name", payload.name);
      return NextResponse.next({ request: { headers: requestHeaders } });
    } catch {
      // Access token expired — try refresh token below
    }
  }

  // Try refresh token to issue new access token
  if (refreshToken) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      const newAccessToken = signAccessToken({
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        name: payload.name,
      });

      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-user-id", payload.userId);
      requestHeaders.set("x-user-role", payload.role);
      requestHeaders.set("x-user-email", payload.email);
      requestHeaders.set("x-user-name", payload.name);

      const response = NextResponse.next({ request: { headers: requestHeaders } });
      response.cookies.set("access_token", newAccessToken, {
        httpOnly: true,
        path: "/",
        maxAge: 365 * 24 * 60 * 60,
        sameSite: "lax",
        secure: true,
      });
      return response;
    } catch {
      // Refresh token also invalid — redirect to login
    }
  }

  // No valid tokens — redirect to login
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete("access_token");
  response.cookies.delete("refresh_token");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
