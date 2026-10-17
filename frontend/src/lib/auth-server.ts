import { getCurrentSession, type UserSession } from "@/lib/session";
import prisma from "@/lib/db/client";
import { NextResponse } from "next/server";

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

/**
 * Enforces that a request has a valid, active user session.
 * Re-validates active status in the database to prevent revoked/banned users from acting.
 */
export async function requireAuth(): Promise<UserSession> {
  const session = await getCurrentSession();
  if (!session) {
    throw new AuthError("Authentication required.", 401);
  }

  // Verify that the user still exists and is active in the database
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) {
    throw new AuthError("Session is invalid or account has been deactivated.", 401);
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

/**
 * Enforces that a user has verified their email address before accessing paid/active exams or checkout.
 */
export async function requireVerifiedEmail(): Promise<UserSession> {
  const session = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { isEmailVerified: true },
  });

  if (!user?.isEmailVerified) {
    throw new AuthError("Email verification required. Please verify your email in Account Settings.", 403);
  }

  return session;
}

/**
 * Enforces that a request has a valid user session with ADMIN role.
 */
export async function requireAdmin(): Promise<UserSession> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    throw new AuthError("Forbidden: Administrator privileges required.", 403);
  }
  return user;
}

/**
 * Standard error response helper for API routes handling authentication errors.
 */
export function handleAuthError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
