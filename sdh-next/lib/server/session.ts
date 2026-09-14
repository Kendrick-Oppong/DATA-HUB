// Cookie/session helpers for route handlers. SERVER ONLY.
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  signSession,
  verifySession,
  SESSION_COOKIE,
  sessionCookieOptions,
  SessionPayload,
} from "./jwt";

export function setSession(res: NextResponse, payload: SessionPayload): NextResponse {
  res.cookies.set(SESSION_COOKIE, signSession(payload), sessionCookieOptions());
  return res;
}

export function clearSession(res: NextResponse): NextResponse {
  res.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(0), maxAge: 0 });
  return res;
}

export function readSession(): SessionPayload | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySession(token);
}
