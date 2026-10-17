import { prisma } from "@/lib/db/client";
import { SUBSCRIPTION_DURATION_DAYS } from "@/lib/constants";
import logger from "@/lib/logger";

interface FulfillmentParams {
  paymentId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
  amountPaise: number;
}

export interface FulfillmentResult {
  success: boolean;
  alreadyFulfilled: boolean;
  subscriptionId?: string;
  error?: string;
}

/**
 * Concurrency-safe payment fulfillment engine.
 * 
 * Works for both:
 * 1. Immediate browser callback verification (/api/payment/verify)
 * 2. Asynchronous Razorpay webhook events (/api/payment/webhook)
 * 
 * Guarantees:
 * - Uses atomic database operations.
 * - Idempotent: If already CAPTURED, returns existing subscription without double-extending.
 * - Safely extends active subscription duration:
 *   If candidate already has an active subscription expiring in the future, extends from current expiresAt (+30 days).
 *   If expired or no subscription, sets from now (+30 days).
 * - Avoids race conditions between simultaneous verification and webhook calls.
 */
export async function fulfillPayment({
  paymentId,
  razorpayPaymentId,
  razorpaySignature,
  amountPaise,
}: FulfillmentParams): Promise<FulfillmentResult> {
  const durationDays = SUBSCRIPTION_DURATION_DAYS; // 30 days
  const durationMs = durationDays * 24 * 60 * 60 * 1000;

  return await prisma.$transaction(async (tx) => {
    // 1. Fetch payment record within transaction
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { subscription: true },
    });

    if (!payment) {
      return { success: false, alreadyFulfilled: false, error: "Payment record not found." };
    }

    // 2. Check if already captured & fulfilled
    if (payment.status === "CAPTURED" && payment.subscription?.status === "ACTIVE") {
      logger.info(
        { paymentId, razorpayPaymentId, subscriptionId: payment.subscription.id },
        "Payment was already fulfilled. Returning existing subscription idempotently."
      );
      return {
        success: true,
        alreadyFulfilled: true,
        subscriptionId: payment.subscription.id,
      };
    }

    // 3. Mark payment as CAPTURED
    const updatedPayment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: "CAPTURED",
        razorpayPaymentId,
        ...(razorpaySignature ? { razorpaySignature } : {}),
      },
    });

    // 4. Determine subscription start and expiry dates
    // Check if the student has any existing active subscription
    const now = new Date();
    const existingActiveSub = await tx.subscription.findFirst({
      where: {
        userId: payment.userId,
        status: "ACTIVE",
        expiresAt: { gt: now },
      },
      orderBy: { expiresAt: "desc" },
    });

    let startedAt = now;
    let expiresAt = new Date(now.getTime() + durationMs);

    if (existingActiveSub && existingActiveSub.expiresAt && existingActiveSub.expiresAt > now) {
      // Safely extend from current expiration date rather than overwriting
      expiresAt = new Date(existingActiveSub.expiresAt.getTime() + durationMs);
      startedAt = existingActiveSub.startedAt || now;
    }

    // 5. Upsert subscription linked to this specific payment
    const subscription = await tx.subscription.upsert({
      where: { paymentId: payment.id },
      update: {
        status: "ACTIVE",
        startedAt,
        expiresAt,
      },
      create: {
        userId: payment.userId,
        paymentId: payment.id,
        status: "ACTIVE",
        startedAt,
        expiresAt,
      },
    });

    logger.info(
      { userId: payment.userId, paymentId: payment.id, subscriptionId: subscription.id, expiresAt },
      "Subscription safely activated/extended upon payment fulfillment"
    );

    return {
      success: true,
      alreadyFulfilled: false,
      subscriptionId: subscription.id,
    };
  });
}
