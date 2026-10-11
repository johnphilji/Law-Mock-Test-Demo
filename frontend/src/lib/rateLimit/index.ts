/**
 * Rate limiting factory.
 *
 * Returns the appropriate rate limiter based on the environment:
 * - Development: In-memory limiter (no Redis required)
 * - Production/Staging: Upstash Redis distributed limiter (required)
 *
 * AMENDMENT COMPLIANCE:
 * Amendment #2 from the final review:
 *   "Security-sensitive endpoints must fail safely (fail closed) when
 *   distributed rate limiting is unavailable. Only explicitly classified
 *   low-risk endpoints may fail open."
 *
 * This module implements the fail-safe classification system:
 * - SECURITY_SENSITIVE endpoints: ALWAYS fail closed (return 429 if limiter unavailable)
 * - LOW_RISK endpoints: configurable via RATE_LIMIT_FAIL_OPEN env var
 *
 * See: docs/SECURITY.md for endpoint classification rationale.
 */

import { rateLimitLogger } from "@/lib/logger";
import { RateLimitError } from "@/lib/errors";

// =============================================================================
// ENDPOINT SENSITIVITY CLASSIFICATION
// =============================================================================

/**
 * Security-sensitive endpoints that MUST fail closed when Redis is unavailable.
 * These endpoints process authentication, payments, or privileged admin actions.
 *
 * If you add a new security-sensitive endpoint, add its identifier here.
 * The application will refuse to operate it if rate limiting infrastructure fails.
 */
export const SECURITY_SENSITIVE_ENDPOINTS = new Set([
  "auth:register",
  "auth:login",
  "auth:forgot-password",
  "auth:reset-password",
  "payment:create-order",
  "payment:verify",
  "admin:any", // All admin endpoints are security-sensitive
] as const);

export type EndpointId = (typeof SECURITY_SENSITIVE_ENDPOINTS extends Set<infer T>
  ? T
  : never) | string;

// =============================================================================
// RATE LIMIT RESULT
// =============================================================================

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number; // Unix timestamp when the window resets
  limit: number;
}

// =============================================================================
// RATE LIMIT CONFIG
// =============================================================================

export interface RateLimitConfig {
  /** Maximum number of requests allowed per window. */
  limit: number;
  /** Window duration in seconds. */
  windowSeconds: number;
  /** Unique identifier for this rate limit rule (used as Redis key prefix). */
  endpointId: EndpointId;
}

// =============================================================================
// ABSTRACT RATE LIMITER INTERFACE
// =============================================================================

export interface RateLimiter {
  check(identifier: string, config: RateLimitConfig): Promise<RateLimitResult>;
}

// =============================================================================
// IN-MEMORY RATE LIMITER (Development only)
// =============================================================================

interface MemoryWindow {
  count: number;
  resetAt: number;
}

class InMemoryRateLimiter implements RateLimiter {
  private readonly store = new Map<string, MemoryWindow>();

  async check(identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const key = `${config.endpointId}:${identifier}`;
    const now = Date.now();
    const windowMs = config.windowSeconds * 1000;

    const existing = this.store.get(key);

    if (!existing || existing.resetAt <= now) {
      // Start a new window.
      const window: MemoryWindow = {
        count: 1,
        resetAt: now + windowMs,
      };
      this.store.set(key, window);
      return {
        allowed: true,
        remaining: config.limit - 1,
        reset: Math.ceil(window.resetAt / 1000),
        limit: config.limit,
      };
    }

    existing.count++;

    if (existing.count > config.limit) {
      return {
        allowed: false,
        remaining: 0,
        reset: Math.ceil(existing.resetAt / 1000),
        limit: config.limit,
      };
    }

    return {
      allowed: true,
      remaining: config.limit - existing.count,
      reset: Math.ceil(existing.resetAt / 1000),
      limit: config.limit,
    };
  }
}

// =============================================================================
// UPSTASH REDIS RATE LIMITER (Production/Staging)
// =============================================================================

class UpstashRateLimiter implements RateLimiter {
  private isAvailable: boolean = true;

  async check(identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
    try {
      // Lazy import — only loaded when Upstash is configured.
      const { Ratelimit } = await import("@upstash/ratelimit");
      const { Redis } = await import("@upstash/redis");

      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });

      const ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(config.limit, `${config.windowSeconds}s`),
        prefix: `plp:rl:${config.endpointId}`,
        analytics: false, // Disable analytics to minimize latency
      });

      const result = await ratelimit.limit(identifier);
      this.isAvailable = true;

      return {
        allowed: result.success,
        remaining: result.remaining,
        reset: Math.ceil(result.reset / 1000),
        limit: result.limit,
      };
    } catch (error) {
      this.isAvailable = false;
      // Re-throw — the calling code handles fail-open/fail-closed logic.
      throw error;
    }
  }

  get available() {
    return this.isAvailable;
  }
}

// =============================================================================
// RATE LIMITER FACTORY
// =============================================================================

let _limiter: RateLimiter | null = null;

function getLimiter(): RateLimiter {
  if (_limiter) return _limiter;

  const isProduction = process.env.APP_ENVIRONMENT === "production";
  const isStaging = process.env.APP_ENVIRONMENT === "staging";
  const hasUpstash = Boolean(process.env.UPSTASH_REDIS_REST_URL);

  if (isProduction || isStaging) {
    if (!hasUpstash) {
      // In production/staging, Redis is mandatory. Fail at startup.
      throw new Error(
        "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set in production/staging. " +
          "In-memory rate limiting is not safe for multi-instance deployments.",
      );
    }
    rateLimitLogger.info("Using Upstash Redis rate limiter");
    _limiter = new UpstashRateLimiter();
  } else {
    // Development: in-memory limiter.
    rateLimitLogger.info("Using in-memory rate limiter (development)");
    _limiter = new InMemoryRateLimiter();
  }

  return _limiter;
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Apply rate limiting to a request.
 *
 * @param identifier - The key to rate limit by (e.g. IP address, user ID)
 * @param config     - Rate limit configuration for this endpoint
 * @throws {RateLimitError} if the rate limit is exceeded or if Redis is unavailable
 *                          and the endpoint is security-sensitive
 */
export async function applyRateLimit(
  identifier: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const isSensitive = SECURITY_SENSITIVE_ENDPOINTS.has(config.endpointId as never);
  const failOpen = process.env.RATE_LIMIT_FAIL_OPEN === "true";

  try {
    const limiter = getLimiter();
    const result = await limiter.check(identifier, config);

    if (!result.allowed) {
      throw new RateLimitError();
    }

    return result;
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw error; // Rate limit exceeded — always propagate
    }

    // Redis/infrastructure failure path.
    if (isSensitive) {
      // Security-sensitive endpoints ALWAYS fail closed.
      // This is non-negotiable per Amendment #2.
      rateLimitLogger.error(
        { endpointId: config.endpointId, err: error },
        "Rate limit infrastructure unavailable — failing closed for security-sensitive endpoint",
      );
      throw new RateLimitError(
        "Service temporarily unavailable. Please try again in a moment.",
      );
    }

    if (!failOpen) {
      rateLimitLogger.error(
        { endpointId: config.endpointId, err: error },
        "Rate limit infrastructure unavailable — failing closed (RATE_LIMIT_FAIL_OPEN=false)",
      );
      throw new RateLimitError(
        "Service temporarily unavailable. Please try again in a moment.",
      );
    }

    // Low-risk endpoint with fail-open configured: allow through with a warning.
    rateLimitLogger.warn(
      { endpointId: config.endpointId, identifier },
      "Rate limit infrastructure unavailable — allowing request (fail-open, low-risk endpoint)",
    );

    // Return a permissive result — the request proceeds but rate limiting is bypassed.
    return {
      allowed: true,
      remaining: config.limit,
      reset: Math.ceil(Date.now() / 1000) + config.windowSeconds,
      limit: config.limit,
    };
  }
}

// =============================================================================
// RATE LIMIT CONFIGURATIONS
// =============================================================================

/**
 * Predefined rate limit configurations for all endpoints.
 * Change limits here — never hard-code them in route handlers.
 */
export const RATE_LIMITS = {
  /** Registration: 5 attempts per 10 minutes per IP. Security-sensitive. */
  register: {
    limit: 5,
    windowSeconds: 600,
    endpointId: "auth:register",
  } satisfies RateLimitConfig,

  /** Login: 10 attempts per 15 minutes per IP+email. Security-sensitive. */
  login: {
    limit: 10,
    windowSeconds: 900,
    endpointId: "auth:login",
  } satisfies RateLimitConfig,

  /** Forgot password: 3 per 60 minutes per IP. Security-sensitive. */
  forgotPassword: {
    limit: 3,
    windowSeconds: 3600,
    endpointId: "auth:forgot-password",
  } satisfies RateLimitConfig,

  /** Reset password: 5 per 60 minutes per IP. Security-sensitive. */
  resetPassword: {
    limit: 5,
    windowSeconds: 3600,
    endpointId: "auth:reset-password",
  } satisfies RateLimitConfig,

  /** Payment order creation: 5 per 10 minutes per user. Security-sensitive. */
  createOrder: {
    limit: 5,
    windowSeconds: 600,
    endpointId: "payment:create-order",
  } satisfies RateLimitConfig,

  /** Payment verification: 10 per 10 minutes per user. Security-sensitive. */
  verifyPayment: {
    limit: 10,
    windowSeconds: 600,
    endpointId: "payment:verify",
  } satisfies RateLimitConfig,

  /**
   * Answer autosave: 60 per minute per attempt.
   * LOW RISK — answers are also stored locally on client.
   * May fail open in development.
   */
  saveAnswer: {
    limit: 60,
    windowSeconds: 60,
    endpointId: "exam:save-answer",
  } satisfies RateLimitConfig,

  /**
   * Exam time sync: 2 per minute per attempt.
   * LOW RISK — client falls back to local countdown if this fails.
   */
  timeSync: {
    limit: 2,
    windowSeconds: 60,
    endpointId: "exam:time-sync",
  } satisfies RateLimitConfig,

  /** Exam submission: 3 per minute per attempt. */
  submitAttempt: {
    limit: 3,
    windowSeconds: 60,
    endpointId: "exam:submit",
  } satisfies RateLimitConfig,

  /**
   * General API: 100 per minute per IP.
   * LOW RISK — covers non-sensitive public endpoints.
   */
  general: {
    limit: 100,
    windowSeconds: 60,
    endpointId: "general",
  } satisfies RateLimitConfig,
} as const;
