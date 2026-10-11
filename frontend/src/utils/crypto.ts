/**
 * Secure utility functions.
 *
 * Cryptographic helpers used throughout the application.
 * Uses Node.js built-in crypto — no external dependencies.
 */
import { randomBytes, timingSafeEqual, createHmac } from "crypto";

/**
 * Generate a cryptographically secure random token.
 * Used for: password reset tokens, email verification tokens.
 *
 * @param byteLength - Number of random bytes (default 32 = 256-bit)
 * @returns Hex-encoded random string
 */
export function generateSecureToken(byteLength = 32): string {
  return randomBytes(byteLength).toString("hex");
}

/**
 * Timing-safe string comparison.
 * Use this instead of === when comparing secrets to prevent timing attacks.
 *
 * Example: comparing a user-provided token to a stored token hash.
 */
export function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Lengths differ — still do a comparison to prevent timing leakage.
    // This is a defense-in-depth measure; the result will be false.
    const dummy = randomBytes(a.length).toString("hex");
    timingSafeEqual(Buffer.from(dummy), Buffer.from(dummy));
    return false;
  }
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Compute an HMAC-SHA256 signature.
 * Used for: Razorpay signature verification, webhook verification.
 *
 * @param secret - The HMAC secret key
 * @param data   - The data to sign
 * @returns Hex-encoded HMAC-SHA256 signature
 */
export function hmacSha256(secret: string, data: string): string {
  return createHmac("sha256", secret).update(data).digest("hex");
}

/**
 * Verify an HMAC-SHA256 signature in constant time.
 * Using timingSafeEqual prevents timing attacks.
 */
export function verifyHmacSha256(secret: string, data: string, signature: string): boolean {
  const expected = hmacSha256(secret, data);
  return timingSafeCompare(expected, signature);
}
