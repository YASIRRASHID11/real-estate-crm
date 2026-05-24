import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "./db";
type UserRole = "ADMIN" | "MANAGER" | "AGENT";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "10y";

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

export function signAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function signRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export function verifyRefreshToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    if (!token) return null;
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<JWTPayload> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export function setAuthCookies(
  accessToken: string,
  refreshToken: string,
  response: Response
): void {
  response.headers.append(
    "Set-Cookie",
    `access_token=${accessToken}; HttpOnly; Path=/; Max-Age=900; SameSite=Strict`
  );
  response.headers.append(
    "Set-Cookie",
    `refresh_token=${refreshToken}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict`
  );
}
