/**
 * Custom error classes for Panther Law Prep.
 *
 * These provide structured error handling throughout the application.
 * Each class carries a machine-readable `code` (used in API responses)
 * and a human-readable `message` (shown to users where safe).
 *
 * Usage in API handlers:
 *   throw new NotFoundError("Test not found");
 *   → API returns { success: false, error: { code: "NOT_FOUND", message: "Test not found" } }
 *
 * IMPORTANT: Never include stack traces, database details, or secrets in
 * messages that reach the client. Use the logger for internal details.
 */

// =============================================================================
// BASE ERROR
// =============================================================================

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  /** If true, this error is safe to expose to the client. */
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    isOperational = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace in V8 environments.
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// =============================================================================
// 400 — BAD REQUEST / VALIDATION
// =============================================================================

export class ValidationError extends AppError {
  public readonly fieldErrors?: Record<string, string[]>;

  constructor(message: string, fieldErrors?: Record<string, string[]>) {
    super(message, "VALIDATION_ERROR", 400);
    this.fieldErrors = fieldErrors;
  }
}

// =============================================================================
// 401 — UNAUTHORIZED (not authenticated)
// =============================================================================

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, "UNAUTHORIZED", 401);
  }
}

// =============================================================================
// 403 — FORBIDDEN (authenticated but not authorized)
// =============================================================================

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, "FORBIDDEN", 403);
  }
}

// =============================================================================
// 404 — NOT FOUND
// =============================================================================

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, "NOT_FOUND", 404);
  }
}

// =============================================================================
// 409 — CONFLICT
// =============================================================================

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
  }
}

// =============================================================================
// 410 — GONE (resource existed but is no longer valid, e.g. expired token)
// =============================================================================

export class GoneError extends AppError {
  constructor(message: string) {
    super(message, "GONE", 410);
  }
}

// =============================================================================
// 422 — UNPROCESSABLE ENTITY (semantically invalid, not just malformed)
// =============================================================================

export class UnprocessableError extends AppError {
  constructor(message: string) {
    super(message, "UNPROCESSABLE", 422);
  }
}

// =============================================================================
// 429 — TOO MANY REQUESTS
// =============================================================================

export class RateLimitError extends AppError {
  constructor(message = "Too many requests. Please try again later.") {
    super(message, "RATE_LIMITED", 429);
  }
}

// =============================================================================
// DOMAIN-SPECIFIC ERRORS
// =============================================================================

export class AuthError extends AppError {
  constructor(message = "Invalid credentials") {
    // Return 401 but with a generic message to prevent user enumeration.
    super(message, "AUTH_FAILED", 401);
  }
}

export class SubscriptionRequiredError extends AppError {
  constructor(message = "An active subscription is required to access this resource") {
    super(message, "SUBSCRIPTION_REQUIRED", 403);
  }
}

export class AttemptStateError extends AppError {
  constructor(message: string) {
    super(message, "INVALID_ATTEMPT_STATE", 409);
  }
}

export class PaymentError extends AppError {
  constructor(message: string, code = "PAYMENT_ERROR") {
    super(message, code, 400);
  }
}

export class PaymentVerificationError extends AppError {
  constructor(message = "Payment verification failed") {
    super(message, "PAYMENT_VERIFICATION_FAILED", 400);
  }
}

export class TestPublishError extends AppError {
  public readonly validationErrors: string[];

  constructor(message: string, validationErrors: string[]) {
    super(message, "TEST_PUBLISH_VALIDATION_FAILED", 422);
    this.validationErrors = validationErrors;
  }
}

// =============================================================================
// 500 — INTERNAL (non-operational errors)
// =============================================================================

export class InternalError extends AppError {
  constructor(message = "An unexpected error occurred") {
    // isOperational = false means this should alert the team.
    super(message, "INTERNAL_ERROR", 500, false);
  }
}

// =============================================================================
// TYPE GUARD
// =============================================================================

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
