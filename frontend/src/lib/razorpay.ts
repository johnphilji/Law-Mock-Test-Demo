import Razorpay from "razorpay";
import { RAZORPAY_TEST_KEY_PREFIX, RAZORPAY_LIVE_KEY_PREFIX } from "@/lib/constants";
import logger from "@/lib/logger";

/**
 * Server-only Razorpay SDK client singleton.
 * Validates test-mode keys and isolates credentials safely.
 */
class RazorpayClientManager {
  private static instance: Razorpay | null = null;

  public static getClient(): Razorpay {
    if (this.instance) {
      return this.instance;
    }

    const keyId = process.env.RAZORPAY_KEY_ID || "";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

    if (!keyId || !keySecret) {
      throw new Error(
        "Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local."
      );
    }

    const env = process.env.APP_ENVIRONMENT || "development";
    if (env !== "production" && !keyId.startsWith(RAZORPAY_TEST_KEY_PREFIX)) {
      throw new Error(
        `Safety violation: In ${env} mode, RAZORPAY_KEY_ID must start with "${RAZORPAY_TEST_KEY_PREFIX}". Live credentials are strictly forbidden.`
      );
    }

    this.instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    return this.instance;
  }
}

export function getRazorpay(): Razorpay {
  return RazorpayClientManager.getClient();
}

export function getRazorpayKeyId(): string {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "";
}

export function getRazorpayKeySecret(): string {
  return process.env.RAZORPAY_KEY_SECRET || "";
}

export function getRazorpayWebhookSecret(): string {
  return process.env.RAZORPAY_WEBHOOK_SECRET || "";
}
