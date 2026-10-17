import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getRazorpayWebhookSecret } from "@/lib/razorpay";
import { verifyHmacSha256 } from "@/utils/crypto";
import { fulfillPayment } from "@/lib/payment-fulfillment";
import logger from "@/lib/logger";

/**
 * POST /api/payment/webhook
 * Dedicated Razorpay webhook receiver.
 * 
 * Safeguards:
 * 1. Reads the exact raw text body to verify HMAC against X-Razorpay-Signature.
 * 2. Deduplicates events using WebhookEvent table with eventId unique constraint (idempotency).
 * 3. Handles:
 *    - payment.captured / order.paid: fulfills payment and subscription.
 *    - payment.failed: updates payment status to FAILED without overwriting captured payments.
 *    - refund.processed: records refund without destructive state corruption.
 * 4. Never logs secrets, tokens, or raw credentials.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Read raw request text (exact bytes required for HMAC)
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";
    const eventId = req.headers.get("x-razorpay-event-id") || "";

    const webhookSecret = getRazorpayWebhookSecret();
    if (!webhookSecret) {
      logger.error("Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET is not configured.");
      return NextResponse.json({ error: "Webhook secret not configured." }, { status: 503 });
    }

    if (!signature) {
      logger.warn("Webhook request missing x-razorpay-signature header.");
      return NextResponse.json({ error: "Signature header required." }, { status: 400 });
    }

    // 2. Verify signature using constant-time comparison
    const isValid = verifyHmacSha256(webhookSecret, rawBody, signature);
    if (!isValid) {
      logger.warn({ eventId }, "Invalid Razorpay webhook signature.");
      return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
    }

    // 3. Parse JSON payload safely
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const eventType = payload.event || "unknown";
    const actualEventId = eventId || payload.event_id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // 4. Idempotency check: insert into WebhookEvent table
    // If this event was already processed or received, ignore duplicate delivery
    let webhookRecord;
    try {
      webhookRecord = await prisma.webhookEvent.create({
        data: {
          provider: "razorpay",
          eventId: actualEventId,
          eventType,
          payload: payload as any,
          processed: false,
        },
      });
    } catch (dbErr: any) {
      // Prisma unique constraint violation code is P2002
      if (dbErr.code === "P2002" || String(dbErr.message).includes("Unique constraint")) {
        logger.info({ eventId: actualEventId, eventType }, "Duplicate webhook delivery ignored idempotently.");
        return NextResponse.json({ success: true, duplicate: true, message: "Event already recorded." }, { status: 200 });
      }
      throw dbErr;
    }

    // 5. Process according to event type
    try {
      switch (eventType) {
        case "payment.captured":
        case "order.paid": {
          const paymentEntity = payload.payload?.payment?.entity || {};
          const orderId = paymentEntity.order_id || payload.payload?.order?.entity?.id;
          const paymentId = paymentEntity.id;
          const amount = Number(paymentEntity.amount || 0);

          if (!orderId) {
            logger.warn({ eventId: actualEventId }, "Webhook event missing order_id.");
            break;
          }

          const localPayment = await prisma.payment.findUnique({
            where: { razorpayOrderId: orderId },
          });

          if (!localPayment) {
            logger.warn({ orderId, eventId: actualEventId }, "Webhook event for unknown local order.");
            break;
          }

          // Safety check: ensure amount matches expected order amount
          if (amount > 0 && amount !== localPayment.amountPaise) {
            logger.error(
              { orderId, webhookAmount: amount, storedAmount: localPayment.amountPaise },
              "Webhook amount mismatch — fulfillment blocked."
            );
            break;
          }

          // Fulfill atomically
          await fulfillPayment({
            paymentId: localPayment.id,
            razorpayPaymentId: paymentId || localPayment.razorpayPaymentId || `pay_${orderId}`,
            amountPaise: localPayment.amountPaise,
          });

          break;
        }

        case "payment.failed": {
          const paymentEntity = payload.payload?.payment?.entity || {};
          const orderId = paymentEntity.order_id;
          const failureReason = paymentEntity.error_description || paymentEntity.error_code || "Payment failed";

          if (orderId) {
            const localPayment = await prisma.payment.findUnique({
              where: { razorpayOrderId: orderId },
            });

            // Safeguard: Do not let delayed failure event overwrite an already CAPTURED payment
            if (localPayment && localPayment.status !== "CAPTURED") {
              await prisma.payment.update({
                where: { id: localPayment.id },
                data: {
                  status: "FAILED",
                  failureReason,
                },
              });
              logger.info({ orderId, failureReason }, "Payment marked as FAILED via webhook.");
            }
          }
          break;
        }

        case "refund.processed": {
          const refundEntity = payload.payload?.refund?.entity || {};
          const paymentId = refundEntity.payment_id;

          if (paymentId) {
            const localPayment = await prisma.payment.findFirst({
              where: { razorpayPaymentId: paymentId },
            });

            if (localPayment) {
              await prisma.payment.update({
                where: { id: localPayment.id },
                data: { status: "REFUNDED" },
              });
              logger.info({ paymentId, localPaymentId: localPayment.id }, "Payment marked REFUNDED via webhook.");
            }
          }
          break;
        }

        default:
          logger.info({ eventType, eventId: actualEventId }, "Unhandled Razorpay webhook event received.");
      }

      // Mark webhook as successfully processed
      await prisma.webhookEvent.update({
        where: { id: webhookRecord.id },
        data: {
          processed: true,
          processedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, processed: true }, { status: 200 });
    } catch (processErr: any) {
      logger.error({ error: processErr.message, eventId: actualEventId }, "Webhook processing error.");
      await prisma.webhookEvent.update({
        where: { id: webhookRecord.id },
        data: {
          processed: false,
          processingError: processErr.message,
        },
      });
      return NextResponse.json({ error: "Failed to process webhook event." }, { status: 500 });
    }
  } catch (err: any) {
    logger.error({ error: err.message }, "Webhook handler unexpected error.");
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
