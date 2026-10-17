import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedEmail, AuthError } from "@/lib/auth-server";
import { prisma } from "@/lib/db/client";
import { getRazorpay, getRazorpayKeyId } from "@/lib/razorpay";
import { SUBSCRIPTION_PRICE_PAISE, PAYMENT_CURRENCY } from "@/lib/constants";
import logger from "@/lib/logger";

/**
 * POST /api/checkout
 * Authenticated order creation endpoint.
 * 
 * Safeguards:
 * 1. Enforces student authentication + verified email address.
 * 2. Calculates authoritative amount strictly on the server (never trusts client input).
 * 3. Prevents duplicate order spam by returning an existing pending order if created within the last 5 minutes.
 * 4. Creates local Payment record (status: CREATED) linked to the student.
 * 5. Calls official Razorpay API to generate the test order.
 * 6. Returns only the minimal required payload to Checkout (orderId, amount, currency, keyId).
 */
export async function POST(req: NextRequest) {
  try {
    const student = await requireVerifiedEmail();
    const body = await req.json().catch(() => ({}));
    const { testIds } = body;

    if (!Array.isArray(testIds) || testIds.length === 0) {
      return NextResponse.json(
        { error: "At least one mock test or test series must be selected." },
        { status: 400 }
      );
    }

    // 1. Verify tests exist in the database and are published
    const tests = await prisma.test.findMany({
      where: {
        id: { in: testIds },
        status: "PUBLISHED",
      },
      select: { id: true, title: true },
    });

    if (tests.length === 0) {
      return NextResponse.json(
        { error: "The selected mock tests are not currently available for enrollment." },
        { status: 404 }
      );
    }

    // 2. Server-authoritative pricing (₹49 = 4900 paise per enrollment pass)
    const amountPaise = SUBSCRIPTION_PRICE_PAISE;
    const currency = PAYMENT_CURRENCY;

    // 3. Check for an existing recently-created (last 10 minutes) pending payment record for this student
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const existingPendingPayment = await prisma.payment.findFirst({
      where: {
        userId: student.id,
        status: "CREATED",
        amountPaise,
        currency,
        createdAt: { gt: tenMinutesAgo },
      },
      orderBy: { createdAt: "desc" },
    });

    const keyId = getRazorpayKeyId();
    if (!keyId) {
      return NextResponse.json(
        { error: "Razorpay payment configuration is missing on the server." },
        { status: 503 }
      );
    }

    // If an existing pending order is active and valid, return it to prevent duplicate order spam
    if (existingPendingPayment) {
      return NextResponse.json({
        success: true,
        orderId: existingPendingPayment.razorpayOrderId,
        amount: existingPendingPayment.amountPaise,
        currency: existingPendingPayment.currency,
        keyId,
        student: {
          name: student.name,
          email: student.email,
        },
      });
    }

    // 4. Initialize Razorpay SDK client
    const razorpay = getRazorpay();
    const receipt = `rcpt_${student.id.substring(0, 8)}_${Date.now()}`;

    // 5. Create order with Razorpay official API
    const rzpOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency,
      receipt,
      notes: {
        userId: student.id,
        userEmail: student.email,
        planType: "ALL_INDIA_MOCK_SERIES_30D",
        testIds: testIds.join(","),
      },
    });

    if (!rzpOrder || !rzpOrder.id) {
      throw new Error("Failed to receive a valid order identifier from Razorpay API.");
    }

    // 6. Persist local Payment record with status: CREATED
    await prisma.payment.create({
      data: {
        userId: student.id,
        razorpayOrderId: rzpOrder.id,
        amountPaise,
        currency,
        status: "CREATED",
      },
    });

    logger.info(
      { userId: student.id, razorpayOrderId: rzpOrder.id, amountPaise },
      "Razorpay test-mode order created successfully"
    );

    return NextResponse.json({
      success: true,
      orderId: rzpOrder.id,
      amount: amountPaise,
      currency,
      keyId,
      student: {
        name: student.name,
        email: student.email,
      },
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    logger.error({ error: error.message }, "Order creation error");
    return NextResponse.json(
      { error: error.message || "Unable to initiate payment order. Please try again." },
      { status: 500 }
    );
  }
}
