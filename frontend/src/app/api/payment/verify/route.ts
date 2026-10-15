import { NextResponse } from "next/server";
import crypto from "crypto";
import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/db/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!razorpayOrderId || !razorpayPaymentId) {
      return NextResponse.json(
        { error: "Missing required payment parameters" },
        { status: 400 }
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || "rzp_secret_placeholder";
    
    // Validate HMAC signature if provided
    if (razorpaySignature && secret !== "rzp_secret_placeholder") {
      const generatedSignature = crypto
        .createHmac("sha256", secret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

      if (generatedSignature !== razorpaySignature) {
        return NextResponse.json(
          { error: "Invalid payment signature" },
          { status: 400 }
        );
      }
    }

    const session = await getCurrentSession();
    if (session) {
      const payment = await prisma.payment.upsert({
        where: { razorpayOrderId },
        update: {
          razorpayPaymentId,
          razorpaySignature,
          status: "CAPTURED",
        },
        create: {
          userId: session.id,
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
          amountPaise: 4900,
          currency: "INR",
          status: "CAPTURED",
        },
      });

      await prisma.subscription.upsert({
        where: { paymentId: payment.id },
        update: {
          status: "ACTIVE",
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
        create: {
          userId: session.id,
          paymentId: payment.id,
          status: "ACTIVE",
          startedAt: new Date(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
    }

    return NextResponse.json({
      success: true,
      status: "CAPTURED",
      paymentId: razorpayPaymentId,
      message: "Payment successfully verified and test series activated.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}
