/**
 * Startup validation module.
 *
 * Validates that required environment variables are present and correct
 * before the application serves any requests.
 *
 * For Razorpay: enforces that the correct key type (test/live) is used
 * for the current environment. This prevents accidental production charges
 * from a development instance.
 *
 * This module is imported from the root layout to run at server startup.
 */

import { RAZORPAY_LIVE_KEY_PREFIX, RAZORPAY_TEST_KEY_PREFIX } from "@/lib/constants";
import logger from "@/lib/logger";

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate all required environment variables.
 * Throws if any required variable is missing or misconfigured.
 * Only runs on the server.
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const env = process.env.APP_ENVIRONMENT ?? "development";
  const isProduction = env === "production";
  const isStaging = env === "staging";
  const isNonDev = isProduction || isStaging;

  // ==========================================================================
  // Required in all environments
  // ==========================================================================

  if (!process.env.DATABASE_URL) {
    errors.push("DATABASE_URL is required");
  }

  if (!process.env.AUTH_SECRET) {
    errors.push("AUTH_SECRET is required");
  } else if (process.env.AUTH_SECRET.length < 32) {
    errors.push("AUTH_SECRET must be at least 32 characters");
  }

  // ==========================================================================
  // Razorpay environment isolation (Amendment #3 from final review)
  // ==========================================================================

  const razorpayKeyId = process.env.RAZORPAY_KEY_ID ?? "";

  if (!razorpayKeyId) {
    if (isNonDev) {
      errors.push("RAZORPAY_KEY_ID is required in production/staging");
    } else {
      warnings.push("RAZORPAY_KEY_ID not set — payment features will not function");
    }
  } else {
    if (isProduction) {
      if (!razorpayKeyId.startsWith(RAZORPAY_LIVE_KEY_PREFIX)) {
        errors.push(
          `CRITICAL: In production, RAZORPAY_KEY_ID must start with "${RAZORPAY_LIVE_KEY_PREFIX}". ` +
            `Got a key starting with "${razorpayKeyId.substring(0, 8)}...". ` +
            `Using test keys in production is not allowed.`,
        );
      }
    } else {
      // Development or staging: must use test keys.
      if (!razorpayKeyId.startsWith(RAZORPAY_TEST_KEY_PREFIX)) {
        errors.push(
          `CRITICAL: In ${env} environment, RAZORPAY_KEY_ID must start with "${RAZORPAY_TEST_KEY_PREFIX}". ` +
            `Using live (production) Razorpay keys in ${env} is forbidden. ` +
            `This prevents accidental charges to real customers.`,
        );
      }
    }
  }

  if (!process.env.RAZORPAY_KEY_SECRET && isNonDev) {
    errors.push("RAZORPAY_KEY_SECRET is required in production/staging");
  }

  if (!process.env.RAZORPAY_WEBHOOK_SECRET && isNonDev) {
    errors.push("RAZORPAY_WEBHOOK_SECRET is required in production/staging");
  }

  // ==========================================================================
  // Rate limiting in production/staging requires Upstash
  // ==========================================================================

  if (isNonDev && !process.env.UPSTASH_REDIS_REST_URL) {
    errors.push(
      "UPSTASH_REDIS_REST_URL is required in production/staging. " +
        "In-memory rate limiting is not safe for multi-instance deployments.",
    );
  }

  if (isNonDev && !process.env.UPSTASH_REDIS_REST_TOKEN) {
    errors.push("UPSTASH_REDIS_REST_TOKEN is required in production/staging");
  }

  // ==========================================================================
  // Email
  // ==========================================================================

  if (!process.env.EMAIL_API_KEY && isNonDev) {
    errors.push("EMAIL_API_KEY is required in production/staging");
  }

  if (!process.env.EMAIL_FROM && isNonDev) {
    errors.push("EMAIL_FROM is required in production/staging");
  }

  // ==========================================================================
  // NEXT_PUBLIC_ variables must be present for client usage
  // ==========================================================================

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    warnings.push("NEXT_PUBLIC_APP_URL not set — using http://localhost:3000");
  }

  // ==========================================================================
  // Report
  // ==========================================================================

  if (errors.length > 0) {
    logger.fatal({ errors, env }, "Environment validation failed — refusing to start");
    errors.forEach((e) => logger.fatal(e));
  }

  if (warnings.length > 0) {
    warnings.forEach((w) => logger.warn(w));
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Run environment validation and throw if invalid.
 * Call this from the application entry point.
 */
export function assertValidEnvironment(): void {
  const result = validateEnvironment();
  if (!result.valid) {
    throw new Error(
      `Environment validation failed:\n${result.errors.map((e) => `  • ${e}`).join("\n")}\n\n` +
        `See .env.example for required configuration.`,
    );
  }
}
