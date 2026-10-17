import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/db/client";
import { supabase } from "@/lib/supabase";
import logger from "@/lib/logger";

/**
 * POST /api/auth/otp/verify-email
 * Verifies the 6-digit OTP using Supabase Auth and marks isEmailVerified: true in Prisma.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { code } = body;
    let email = body.email ? String(body.email).toLowerCase().trim() : "";

    const session = await getCurrentSession();
    if (!email && session) {
      email = session.email;
    }

    if (!email) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    const token = String(code || "").trim();
    if (!token || !/^\d{6}$/.test(token)) {
      return NextResponse.json({ error: "Please enter a valid 6-digit verification code." }, { status: 400 });
    }

    // Try verifying as 'signup' first (for newly created accounts)
    let { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "signup",
    });

    // If 'signup' fails, try 'email' (for existing accounts / magic link / signin)
    if (verifyError) {
      const retry = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });

      if (!retry.error) {
        verifyError = null;
        data = retry.data;
      }
    }

    if (verifyError) {
      logger.warn({ email, error: verifyError.message }, "Supabase OTP verification failed");
      return NextResponse.json({ error: verifyError.message || "Token has expired or is invalid." }, { status: 400 });
    }

    // Mark user as verified in Prisma database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true },
      });
      logger.info({ userId: user.id, email }, "User email marked as verified in database");
    }

    return NextResponse.json({
      success: true,
      message: "Email verified successfully.",
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Error verifying email OTP");
    return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 500 });
  }
}
