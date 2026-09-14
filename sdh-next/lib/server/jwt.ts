// JWT session helpers + cookie config. SERVER ONLY.
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev-insecure-secret-change-me";
export const SESSION_COOKIE = "sdh_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface SessionPayload {
  uid: string;
  role: string;
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: SESSION_MAX_AGE });
}

export function verifySession(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  try {
    return jwt.verify(token, SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

// Options for NextResponse.cookies.set(...)
export function sessionCookieOptions(maxAge = SESSION_MAX_AGE) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}
