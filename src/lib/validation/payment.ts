/**
 * Zod validation schemas — Payment
 * Uses Zod v4 API.
 */
import { z } from "zod";

// =============================================================================
// CREATE ORDER
// =============================================================================

/**
 * The client sends no sensitive data when creating an order.
 * The server determines the amount from its own configuration.
 *
 * This schema only accepts acknowledgment of intent.
 */
export const CreateOrderSchema = z.object({
  // No client-supplied amount. Price comes from server constants.
  // This is intentional — prevents price manipulation.
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

// =============================================================================
// VERIFY PAYMENT (Frontend callback path)
// =============================================================================

export const VerifyPaymentSchema = z.object({
  razorpayOrderId: z
    .string()
    .min(1, "Order ID is required")
    .startsWith("order_", "Invalid order ID format"),
  razorpayPaymentId: z
    .string()
    .min(1, "Payment ID is required")
    .startsWith("pay_", "Invalid payment ID format"),
  razorpaySignature: z
    .string()
    .min(1, "Signature is required")
    .regex(/^[a-f0-9]{64}$/, "Invalid signature format"),
});

export type VerifyPaymentInput = z.infer<typeof VerifyPaymentSchema>;

// =============================================================================
// WEBHOOK (Razorpay → Server)
// =============================================================================

/**
 * Webhook payloads are not strictly typed here because Razorpay sends
 * various event types. The webhook handler validates the signature first,
 * then dispatches based on event type with appropriate field access.
 */
export const WebhookPayloadSchema = z.object({
  entity: z.string(),
  account_id: z.string(),
  event: z.string(),
  contains: z.array(z.string()),
  payload: z.record(z.string(), z.unknown()),
});

export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;
