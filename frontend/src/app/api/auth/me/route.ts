import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import prisma from "@/lib/db/client";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // Fetch verified user details from database
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      passwordHash: true,
      createdAt: true,
      lastLoginAt: true,
      accounts: {
        select: {
          id: true,
          provider: true,
        },
      },
    },
  });

  if (!user || !user.isActive) {
    return NextResponse.json({ user: null, error: "Account inactive" }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      hasPassword: Boolean(user.passwordHash),
      linkedAccounts: (user.accounts || []).map((acc: { id: string; provider: string }) => ({
        id: acc.id,
        provider: acc.provider,
      })),
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    },
  });
}
