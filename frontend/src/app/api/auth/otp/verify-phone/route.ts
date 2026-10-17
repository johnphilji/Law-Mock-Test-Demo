import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/db/client";
import { normalizePhoneNumber } from "@/lib/auth/phone";
import { verifyOtp } from "@/lib/auth/otp";
import logger from "@/lib/logger";

/**
 * POST /api/auth/otp/verify-phone
 * Verifies the 6-digit phone OTP and marks isPhoneVerified: true on the student account.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { code } = body;
    let rawPhone = body.phone ? String(body.phone) : "";

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { phone: true },
    });

    if (!rawPhone && user?.phone) {
      rawPhone = user.phone;
    }

    const { valid, normalized, error: phoneError } = normalizePhoneNumber(rawPhone);
    if (!valid || !normalized) {
      return NextResponse.json({ error: phoneError || "Valid phone number required." }, { status: 400 });
    }

    if (!code || !/^\d{6}$/.test(String(code).trim())) {
      return NextResponse.json({ error: "Please enter a valid 6-digit verification code." }, { status: 400 });
    }

    const verificationResult = await verifyOtp(normalized, "phone", String(code).trim());
    if (!verificationResult.success) {
      return NextResponse.json({ error: verificationResult.error }, { status: 400 });
    }

    // Mark phone verified on the authenticated student
    await prisma.user.update({
      where: { id: session.id },
      data: {
        phone: normalized,
        isPhoneVerified: true,
      },
    });

    logger.info({ userId: session.id, phone: normalized }, "Student phone marked verified");

    return NextResponse.json({
      success: true,
      message: "Phone number verified successfully.",
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Error verifying phone OTP");
    return NextResponse.json({ error: "Failed to verify phone code." }, { status: 500 });
  }
}
