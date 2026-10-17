import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import logger from "@/lib/logger";

/**
 * POST /api/auth/otp/send-email
 * Sends 6-digit email verification OTP to the target email via Supabase Auth + Resend SMTP.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let email = body.email ? String(body.email).toLowerCase().trim() : "";

    if (!email) {
      const session = await getCurrentSession();
      if (session) {
        email = session.email;
      }
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    // Call Supabase Auth to generate & send 6-digit OTP
    const { error: supabaseError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (supabaseError) {
      logger.error({ email, error: supabaseError.message }, "Supabase OTP send failed");
      return NextResponse.json({ error: supabaseError.message }, { status: 400 });
    }

    logger.info({ email }, "Supabase email OTP dispatched");

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email address.",
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Error sending email OTP");
    return NextResponse.json({ error: "Failed to send verification code. Please try again." }, { status: 500 });
  }
}
