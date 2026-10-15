import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: "STUDENT" | "ADMIN";
}

const SESSION_COOKIE_NAME = "auth_session";
const SESSION_EXPIRATION_DAYS = 7;

function getEncodedKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET || "12345678901234567890123456789012";
  return new TextEncoder().encode(secret);
}

/**
 * Sign a JWT token containing the user's session data.
 */
export async function signSessionToken(payload: UserSession): Promise<string> {
  const key = getEncodedKey();
  return new SignJWT({
    id: payload.id,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_EXPIRATION_DAYS}d`)
    .sign(key);
}

/**
 * Verify a JWT session token. Returns the session payload or null if invalid or expired.
 */
export async function verifySessionToken(token: string): Promise<UserSession | null> {
  if (!token) return null;
  try {
    const key = getEncodedKey();
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });

    if (!payload.id || !payload.email || !payload.role) {
      return null;
    }

    return {
      id: String(payload.id),
      email: String(payload.email),
      name: String(payload.name ?? ""),
      role: payload.role as "STUDENT" | "ADMIN",
    };
  } catch {
    return null;
  }
}

/**
 * Store the authenticated session token in an HTTP-only secure cookie.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  const expires = new Date(Date.now() + SESSION_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires,
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Delete the session cookie (logout).
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Retrieve and verify the current user session from cookies.
 */
export async function getCurrentSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export { SESSION_COOKIE_NAME };
