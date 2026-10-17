import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth-server";
import { prisma } from "@/lib/db/client";
import { getRazorpay, getRazorpayKeySecret } from "@/lib/razorpay";
import { verifyHmacSha256 } from "@/utils/crypto";
import { VerifyPaymentSchema } from "@/lib/validation/payment";
import { fulfillPayment } from "@/lib/payment-fulfillment";
import logger from "@/lib/logger";

/**
 * POST /api/payment/verify
 * Server-side payment verification endpoint.
 * 
 * Safeguards:
 * 1. Enforces student authentication.
 * 2. Validates payload schema using Zod.
 * 3. Finds local Payment record by razorpayOrderId and confirms it belongs to the authenticated student.
 * 4. Verifies HMAC-SHA256 signature using timingSafeEqual in constant time.
 * 5. Queries Razorpay Server-Side API directly to confirm authoritative status is 'captured' or 'authorized'.
 * 6. Validates that the amount and currency on Razorpay match the stored order.
 * 7. Atomically marks payment CAPTURED and activates/extends student subscription.
 */
export async function POST(req: NextRequest) {
  try {
    const student = await requireAuth();
    const rawBody = await req.json().catch(() => ({}));

    // 1. Validate input structure
    const parsed = VerifyPaymentSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payment verification parameters.", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;

    // 2. Locate local Payment record by razorpayOrderId
    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Order record not found." },
        { status: 404 }
      );
    }

    // 3. Confirm payment belongs to the authenticated student
    if (payment.userId !== student.id) {
      logger.warn(
        { studentId: student.id, paymentUserId: payment.userId, razorpayOrderId },
        "Security Alert: Cross-student payment verification attempt detected."
      );
      return NextResponse.json(
        { error: "Unauthorized access to payment order." },
        { status: 403 }
      );
    }

    // 4. Verify HMAC-SHA256 signature in constant time
    const keySecret = getRazorpayKeySecret();
    if (!keySecret) {
      return NextResponse.json(
        { error: "Payment verification configuration error." },
        { status: 503 }
      );
    }

    const expectedData = `${razorpayOrderId}|${razorpayPaymentId}`;
    const isValidSignature = verifyHmacSha256(keySecret, expectedData, razorpaySignature);

    if (!isValidSignature) {
      logger.warn(
        { razorpayOrderId, razorpayPaymentId },
        "Invalid Razorpay signature provided in payment verification."
      );
      return NextResponse.json(
        { error: "Invalid payment signature." },
        { status: 400 }
      );
    }

    // 5. Query Razorpay Server API for authoritative verification
    const razorpay = getRazorpay();
    let rzpPayment: any;
    try {
      rzpPayment = await razorpay.payments.fetch(razorpayPaymentId);
    } catch (apiErr: any) {
      logger.error(
        { error: apiErr.message, razorpayPaymentId },
        "Failed to fetch payment details from Razorpay API"
      );
      return NextResponse.json(
        { error: "Unable to confirm payment status with Razorpay servers." },
        { status: 502 }
      );
    }

    if (!rzpPayment) {
      return NextResponse.json(
        { error: "Payment not found on Razorpay." },
        { status: 404 }
      );
    }

    // 6. Verify order match, amount match, currency match
    if (rzpPayment.order_id !== razorpayOrderId) {
      logger.error(
        { orderIdInPayment: rzpPayment.order_id, expectedOrderId: razorpayOrderId },
        "Security Alert: Razorpay payment order_id does not match verification request."
      );
      return NextResponse.json(
        { error: "Payment order mismatch." },
        { status: 400 }
      );
    }

    if (Number(rzpPayment.amount) !== payment.amountPaise) {
      logger.error(
        { rzpAmount: rzpPayment.amount, storedAmount: payment.amountPaise },
        "Security Alert: Payment amount mismatch."
      );
      return NextResponse.json(
        { error: "Payment amount does not match expected order amount." },
        { status: 400 }
      );
    }

    if (rzpPayment.currency !== payment.currency) {
      return NextResponse.json(
        { error: "Currency mismatch." },
        { status: 400 }
      );
    }

    // 7. Verify status is captured or authorized (auto-capture if authorized)
    if (rzpPayment.status !== "captured" && rzpPayment.status !== "authorized") {
      logger.warn(
        { rzpStatus: rzpPayment.status, razorpayPaymentId },
        "Attempted to fulfill an uncaptured payment"
      );
      return NextResponse.json(
        { error: `Payment is not captured. Current status is ${rzpPayment.status}.` },
        { status: 400 }
      );
    }

    // 8. Atomically fulfill payment & activate subscription
    const fulfillment = await fulfillPayment({
      paymentId: payment.id,
      razorpayPaymentId,
      razorpaySignature,
      amountPaise: payment.amountPaise,
    });

    if (!fulfillment.success) {
      return NextResponse.json(
        { error: fulfillment.error || "Failed to fulfill subscription." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status: "CAPTURED",
      subscriptionId: fulfillment.subscriptionId,
      alreadyFulfilled: fulfillment.alreadyFulfilled,
      message: "Payment successfully verified and subscription activated.",
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error({ error: error.message }, "Payment verification error");
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during payment verification." },
      { status: 500 }
    );
  }
}
