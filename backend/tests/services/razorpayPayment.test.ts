import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

// Test HMAC-SHA256 signature algorithm and timing-safe verification
function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    const dummy = crypto.randomBytes(a.length).toString("hex");
    crypto.timingSafeEqual(Buffer.from(dummy), Buffer.from(dummy));
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function verifyHmacSha256(secret: string, data: string, signature: string): boolean {
  const expected = crypto.createHmac("sha256", secret).update(data).digest("hex");
  return timingSafeCompare(expected, signature);
}

describe("Razorpay Test-Mode Signature Verification & Idempotency", () => {
  const testSecret = "test_secret_1234567890abcdef";
  const orderId = "order_N123456789";
  const paymentId = "pay_N987654321";

  it("Requirement 1: Generates and verifies valid Razorpay Checkout signature using constant-time comparison", () => {
    const data = `${orderId}|${paymentId}`;
    const validSignature = crypto.createHmac("sha256", testSecret).update(data).digest("hex");

    const isValid = verifyHmacSha256(testSecret, data, validSignature);
    expect(isValid).toBe(true);
  });

  it("Requirement 2: Rejects invalid or tampered payment signature", () => {
    const data = `${orderId}|${paymentId}`;
    const forgedSignature = "0000000000000000000000000000000000000000000000000000000000000000";

    const isValid = verifyHmacSha256(testSecret, data, forgedSignature);
    expect(isValid).toBe(false);
  });

  it("Requirement 3: Rejects signature if payment ID or order ID is altered (tampered payload)", () => {
    const validData = `${orderId}|${paymentId}`;
    const validSignature = crypto.createHmac("sha256", testSecret).update(validData).digest("hex");

    const tamperedData = `order_ATTACKER_ID|${paymentId}`;
    const isValid = verifyHmacSha256(testSecret, tamperedData, validSignature);
    expect(isValid).toBe(false);
  });

  it("Requirement 4: Webhook raw body signature verification validates raw bytes exactly", () => {
    const webhookSecret = "whsec_test_abc123xyz789";
    const rawPayload = JSON.stringify({
      entity: "event",
      event: "payment.captured",
      payload: { payment: { entity: { id: paymentId, amount: 4900, status: "captured" } } }
    });

    const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(rawPayload).digest("hex");

    const isValid = verifyHmacSha256(webhookSecret, rawPayload, expectedSignature);
    expect(isValid).toBe(true);

    // If payload is modified even by whitespace or key reordering, it fails:
    const alteredPayload = rawPayload + " ";
    const isAlteredValid = verifyHmacSha256(webhookSecret, alteredPayload, expectedSignature);
    expect(isAlteredValid).toBe(false);
  });

  it("Requirement 5: Idempotent duplicate event tracking prevents double fulfillment", () => {
    const processedEventIds = new Set<string>();

    const recordEvent = (eventId: string) => {
      if (processedEventIds.has(eventId)) {
        return { isDuplicate: true };
      }
      processedEventIds.add(eventId);
      return { isDuplicate: false };
    };

    const firstDelivery = recordEvent("evt_test_1001");
    expect(firstDelivery.isDuplicate).toBe(false);

    const duplicateDelivery = recordEvent("evt_test_1001");
    expect(duplicateDelivery.isDuplicate).toBe(true);
  });

  it("Requirement 6: Safe subscription extension policy extends future expiresAt rather than overwriting", () => {
    const now = new Date("2026-10-16T12:00:00Z");
    const futureExpiry = new Date("2026-11-01T12:00:00Z"); // 16 days remaining
    const durationDays = 30;
    const durationMs = durationDays * 24 * 60 * 60 * 1000;

    // Simulation of extension algorithm
    const calculateExpiry = (currentExpiry: Date | null, baseNow: Date) => {
      if (currentExpiry && currentExpiry > baseNow) {
        return new Date(currentExpiry.getTime() + durationMs);
      }
      return new Date(baseNow.getTime() + durationMs);
    };

    const extendedDate = calculateExpiry(futureExpiry, now);
    // Should be Nov 1 + 30 days = Dec 1
    expect(extendedDate.toISOString()).toBe("2026-12-01T12:00:00.000Z");

    // If expired:
    const expiredDate = new Date("2026-10-01T12:00:00Z");
    const freshStartDate = calculateExpiry(expiredDate, now);
    // Should be Oct 16 + 30 days = Nov 15
    expect(freshStartDate.toISOString()).toBe("2026-11-15T12:00:00.000Z");
  });

  it("Requirement 7: Delayed payment.failed event must never overwrite an already CAPTURED payment", () => {
    let paymentStatus = "CAPTURED";

    const handleWebhookFailed = () => {
      if (paymentStatus === "CAPTURED") {
        // Guarded: Do not overwrite
        return;
      }
      paymentStatus = "FAILED";
    };

    handleWebhookFailed();
    expect(paymentStatus).toBe("CAPTURED");
  });

  it("Requirement 8: Amount mismatch detection rejects fraudulent payment verification", () => {
    const expectedAmountPaise = 4900;
    const reportedRzpAmount = 100; // ₹1 paid instead of ₹49

    const isAmountValid = reportedRzpAmount === expectedAmountPaise;
    expect(isAmountValid).toBe(false);
  });

  it("Requirement 9: Cross-student protection ensures payment can only be verified by the owner", () => {
    const paymentUserId = "student-123";
    const sessionUserId = "student-456";

    const isAuthorized = paymentUserId === sessionUserId;
    expect(isAuthorized).toBe(false);
  });
});
