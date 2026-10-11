/**
 * Structured logger for Panther Law Prep.
 *
 * Uses pino for fast, structured JSON logging.
 *
 * SECURITY: This logger is configured to NEVER log secrets.
 * The redact list below is mandatory and must be updated if new
 * sensitive fields are added to the application.
 *
 * In development: pretty-printed output.
 * In production: JSON to stdout (consumed by log aggregator).
 */
import pino from "pino";

// Fields that must never appear in logs, even in nested objects.
// This is a defense-in-depth measure — never log these values anywhere.
const REDACTED_PATHS = [
  "password",
  "passwordHash",
  "passwordConfirm",
  "token",
  "secret",
  "apiKey",
  "authorization",
  "cookie",
  "razorpaySignature",
  "razorpayKeySecret",
  "webhookSecret",
  "authSecret",
  "DATABASE_URL",
  "*.password",
  "*.passwordHash",
  "*.token",
  "*.secret",
];

const isDevelopment = process.env.APP_ENVIRONMENT !== "production";
const logLevel = process.env.LOG_LEVEL ?? (isDevelopment ? "debug" : "info");

const logger = pino({
  level: logLevel,
  redact: {
    paths: REDACTED_PATHS,
    censor: "[REDACTED]",
  },
  // In production: plain JSON.
  // In development: human-readable format via pino-pretty (if installed).
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  // Base fields added to every log entry.
  base: {
    env: process.env.APP_ENVIRONMENT ?? "development",
    app: "panther-law-prep",
  },
  // Timestamp in ISO 8601 format (not epoch) for human readability in logs.
  timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;

// Named child loggers for each major subsystem.
// Use these in services/handlers to add context automatically.
export const authLogger = logger.child({ subsystem: "auth" });
export const paymentLogger = logger.child({ subsystem: "payment" });
export const examLogger = logger.child({ subsystem: "exam" });
export const webhookLogger = logger.child({ subsystem: "webhook" });
export const adminLogger = logger.child({ subsystem: "admin" });
export const emailLogger = logger.child({ subsystem: "email" });
export const rateLimitLogger = logger.child({ subsystem: "rateLimit" });
