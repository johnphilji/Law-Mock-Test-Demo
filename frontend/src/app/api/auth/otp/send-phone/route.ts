import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/db/client";
import { normalizePhoneNumber } from "@/lib/auth/phone";
import { createAndSaveOtp } from "@/lib/auth/otp";
import logger from "@/lib/logger";

/**
 * POST /api/auth/otp/send-phone
 * Validates phone, checks cooldown, generates 6-digit OTP and delivers via SMS or dev logger.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required to add and verify a phone number." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const rawPhone = body.phone ? String(body.phone) : "";

    const { valid, normalized, error: phoneError } = normalizePhoneNumber(rawPhone);
    if (!valid || !normalized) {
      return NextResponse.json({ error: phoneError || "Invalid phone number." }, { status: 400 });
    }

    // Check if phone number is already verified by another account
    const existing = await prisma.user.findFirst({
      where: {
        phone: normalized,
        isPhoneVerified: true,
        id: { not: session.id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This mobile number is already registered and verified with another account." },
        { status: 409 }
      );
    }

    const otpResult = await createAndSaveOtp(normalized, "phone");
    if (!otpResult.success) {
      return NextResponse.json(
        { error: otpResult.error, cooldownRemaining: otpResult.cooldownRemaining },
        { status: 429 }
      );
    }

    // Update candidate's phone in unverified state until code confirmed
    await prisma.user.update({
      where: { id: session.id },
      data: { phone: normalized, isPhoneVerified: false },
    });

    // Check for Twilio / SMS provider credentials
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

    if (twilioSid && twilioToken && twilioFrom && twilioSid.startsWith("AC")) {
      try {
        const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
        const formParams = new URLSearchParams({
          To: normalized,
          From: twilioFrom,
          Body: `Your Panther Law Prep phone verification code is: ${otpResult.otp}. Valid for 10 minutes.`,
        });

        await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formParams.toString(),
        });
      } catch (smsErr: any) {
        logger.error({ error: smsErr.message }, "SMS gateway dispatch error");
      }
    } else {
      logger.info({ phone: normalized, devOtp: otpResult.otp }, "[DEV ONLY] Phone OTP issued (Twilio credentials not configured)");
    }

    return NextResponse.json({
      success: true,
      phone: normalized,
      message: `Verification code sent to ${normalized}.`,
      ...(process.env.APP_ENVIRONMENT === "development" ? { devOtp: otpResult.otp } : {}),
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Error sending phone OTP");
    return NextResponse.json({ error: "Failed to send SMS code. Please try again." }, { status: 500 });
  }
}
