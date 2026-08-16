import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "gitintent_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

function getSessionSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing required environment variable: SESSION_SECRET");
  }

  return new TextEncoder().encode(secret);
}

type SessionPayload = {
  userId: string;
};

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const secret = getSessionSecretKey();

  return await new SignJWT({ userId: payload.userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getSessionSecretKey();
    const verified = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    const userId = typeof verified.payload.userId === "string" ? verified.payload.userId : null;
    if (!userId) return null;

    return { userId };
  } catch {
    return null;
  }
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  };
}

export async function getSessionUserIdFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  return payload?.userId ?? null;
}
