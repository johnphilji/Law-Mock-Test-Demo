/**
 * Application-wide constants.
 *
 * Business values are defined here on the SERVER side.
 * The browser must never be trusted to determine prices, durations,
 * or other business-critical values.
 *
 * To change pricing or subscription terms: change here and redeploy.
 * Never hard-code these values in API handlers or services.
 */

// =============================================================================
// SUBSCRIPTION
// =============================================================================

/** The subscription price in Indian Paise (₹49 = 4900 paise). */
export const SUBSCRIPTION_PRICE_PAISE = 4900 as const;

/** The subscription price in INR (for display purposes only). */
export const SUBSCRIPTION_PRICE_INR = 49 as const;

/** Subscription duration in days. */
export const SUBSCRIPTION_DURATION_DAYS = 30 as const;

/** Currency code. */
export const PAYMENT_CURRENCY = "INR" as const;

// =============================================================================
// EXAM / ATTEMPT
// =============================================================================

/**
 * Grace period in seconds after `expiresAt` during which the server will
 * still accept a submission.
 *
 * This accounts for genuine network latency between the client detecting
 * expiry and the server receiving the submission request.
 * It does NOT extend the exam — answers recorded after `expiresAt` are ignored.
 */
export const ATTEMPT_SUBMISSION_GRACE_SECONDS = 30 as const;

/**
 * How often the client should sync with server time (in milliseconds).
 * 60 seconds is a reasonable interval that balances accuracy vs. API load.
 */
export const TIMER_SYNC_INTERVAL_MS = 60_000 as const;

/**
 * Maximum number of concurrent active attempts per user per test.
 * Enforced by database constraint + service check.
 */
export const MAX_ACTIVE_ATTEMPTS_PER_TEST = 1 as const;

/**
 * Debounce delay for answer autosave (milliseconds).
 * Prevents excessive API calls when a student rapidly changes answers.
 */
export const ANSWER_AUTOSAVE_DEBOUNCE_MS = 1_500 as const;

// =============================================================================
// PAGINATION
// =============================================================================

/** Default page size for admin list endpoints. */
export const DEFAULT_PAGE_SIZE = 20 as const;

/** Maximum allowed page size (prevents someone requesting 10,000 records). */
export const MAX_PAGE_SIZE = 100 as const;

// =============================================================================
// AUTHENTICATION
// =============================================================================

/** Password minimum length. */
export const PASSWORD_MIN_LENGTH = 8 as const;

/** Password reset token validity duration in hours. */
export const PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 1 as const;

// =============================================================================
// SUPPORT TICKETS
// =============================================================================

/** Maximum message length in characters for a support message. */
export const SUPPORT_MESSAGE_MAX_LENGTH = 5_000 as const;

// =============================================================================
// RAZORPAY ENVIRONMENT VALIDATION
// =============================================================================

/**
 * Key prefixes used to validate Razorpay credentials match the environment.
 * Production must use rzp_live_, everything else must use rzp_test_.
 */
export const RAZORPAY_LIVE_KEY_PREFIX = "rzp_live_" as const;
export const RAZORPAY_TEST_KEY_PREFIX = "rzp_test_" as const;
